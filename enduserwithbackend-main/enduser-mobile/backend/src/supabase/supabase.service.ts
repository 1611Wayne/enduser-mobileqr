import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private damayanClient!: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    // BayaniHub DB (primary)
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Damayan DB (external disaster management)
    const damayanUrl = this.config.getOrThrow<string>('DAMAYAN_SUPABASE_URL');
    const damayanKey = this.config.getOrThrow<string>('DAMAYAN_SERVICE_ROLE_KEY');

    this.damayanClient = createClient(damayanUrl, damayanKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Connected to BayaniHub DB and Damayan DB');
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getDamayanClient(): SupabaseClient {
    return this.damayanClient;
  }

  getAnonKey(): string {
    return this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  getUrl(): string {
    return this.config.getOrThrow<string>('SUPABASE_URL');
  }

  // --- BAYANIHUB WORKFLOW INSERTS ---

  async insertVolunteerApplication(data: any, volunteerAuthId: string, file?: Express.Multer.File) {
    if (!data.center_id || !data.role) {
      throw new Error("Missing center_id or role in application payload.");
    }

    // 1. Resolve role_id — find or create a role for this evacuation center
    let { data: roles } = await this.client
      .from('volunteer_roles')
      .select('id')
      .ilike('title', data.role)
      .limit(1);

    let roleId;
    if (!roles || roles.length === 0) {
      // Auto-provision a role (not campaign-bound since we now use evacuation centers)
      const { data: newRole, error: roleErr } = await this.client
        .from('volunteer_roles')
        .insert([{
          title: data.role,
          status: 'open',
          slots_total: 10
        }]).select('id').single();
      if (roleErr) throw new Error(`Role Creation Error: ${roleErr.message}`);
      roleId = newRole.id;
    } else {
      roleId = roles[0].id;
    }

    // 2. Upload Document (if provided)
    let resumeKey = null;
    if (file) {
      const BUCKET = 'volunteer-documents.';
      const filePath = `${volunteerAuthId}/${Date.now()}-${file.originalname}`;
      
      const { error: uploadError } = await this.client.storage
        .from(BUCKET)
        .upload(filePath, file.buffer, { contentType: file.mimetype });
        
      if (uploadError) throw new Error(`Document upload error: ${uploadError.message}`);
      
      const { data: urlData } = this.client.storage.from(BUCKET).getPublicUrl(filePath);
      resumeKey = urlData.publicUrl;
    }

    // 3. Condense Questionnaire Data into Motivation field
    const motivationStr = `Questionnaire Assessment:
- Evacuation Center: ${data.center_name || 'N/A'}
- Disaster Experience: ${data.disaster_experience === 'true' ? 'Yes' : 'No'}
- Rugged Environment Comfort: ${data.rugged_environment === 'true' ? 'Yes' : 'No'}
- Medical Conditions/Restrictions: ${data.medical_conditions === 'true' ? 'Yes' : 'No'}
- Vaccinations Current: ${data.vaccinations_current === 'true' ? 'Yes' : 'No'}
- Can Lift 25lbs: ${data.can_lift_25lbs === 'true' ? 'Yes' : 'No'}
- Transportation: ${data.has_transportation === 'true' ? 'Yes' : 'No'} (${data.transportation_mode || 'N/A'})
- Background Check Agreed: ${data.background_check_agreed === 'true' ? 'Yes' : 'No'}
- Required Documents Provided: ${data.documents_agreed === 'true' ? 'Yes' : 'No'}
- Over 18: ${data.age_verified === 'true' ? 'Yes' : 'No'}
- Code of Conduct / Safety Agreed: Yes`;

    // 4. Insert Application
    const { data: result, error } = await this.client
      .from('volunteer_applications')
      .insert([{
        role_id: roleId,
        volunteer_auth_id: volunteerAuthId,
        motivation: motivationStr,
        skills: data.role,
        availability: data.time_slot,
        resume_key: resumeKey,
        status: 'submitted'
      }])
      .select();
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }
  async getVolunteerCampaigns() {
    this.logger.log('[DEBUG] Fetching evacuation centers from Damayan DB...');
    // Fetch evacuation centers from Damayan DB (all statuses for now)
    const { data: result, error } = await this.damayanClient
      .from('evacuation_centers')
      .select('id, name, municipality, barangay, status, capacity, current_occupancy');
      
    if (error) {
      this.logger.error(`[DEBUG] Damayan DB error: ${error.message}`);
      throw new Error(`Damayan DB Error: ${error.message}`);
    }
    this.logger.log(`[DEBUG] Found ${result?.length ?? 0} evacuation center(s). Statuses: ${result?.map(r => r.status).join(', ')}`);
    return result;
  }

  async getActiveCampaigns() {
    this.logger.log('[DEBUG] Fetching relief operations from Damayan DB...');
    // Fetch relief operations from Damayan DB (all statuses for now)
    const { data: result, error } = await this.damayanClient
      .from('relief_operations')
      .select('id, name, description, status');
      
    if (error) {
      this.logger.error(`[DEBUG] Damayan DB error: ${error.message}`);
      throw new Error(`Damayan DB Error: ${error.message}`);
    }
    this.logger.log(`[DEBUG] Found ${result?.length ?? 0} relief operation(s). Statuses: ${result?.map(r => r.status).join(', ')}`);
    return result;
  }

  async insertDonation(donationData: any, donorAuthId: string) {
    const { campaign_id, items } = donationData;
    
    if (!campaign_id || !items || !Array.isArray(items)) {
      throw new Error("Invalid donation payload. Mission campaign_id or items array.");
    }

    const rows = items.map((item: any) => ({
      campaign_id,
      donor_auth_id: donorAuthId,
      status: 'pending',
      item_name: item.name,
      quantity: parseInt(item.qty, 10) || 1,
      unit: (item.unit || 'pieces').toLowerCase(),
      condition: (item.condition || 'good').toLowerCase().replace(/\s+|-/g, '_'),
    }));

    const { data: result, error } = await this.client
      .from('donations')
      .insert(rows)
      .select();
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }

  async getUserApplications(volunteerAuthId: string) {
    this.logger.log(`[DEBUG] Fetching applications for user ID: ${volunteerAuthId}`);

    // Fetch volunteer applications for the authenticated user
    // Note: the timestamp column is 'applied_at', not 'created_at'
    const { data: result, error } = await this.client
      .from('volunteer_applications')
      .select('id, role_id, status, skills, availability, applied_at')
      .eq('volunteer_auth_id', volunteerAuthId)
      .order('applied_at', { ascending: false });
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    
    this.logger.log(`[DEBUG] Found ${result?.length ?? 0} application(s) for user ${volunteerAuthId}`);
    if (result && result.length > 0) {
      this.logger.log(`[DEBUG] First record: ${JSON.stringify(result[0])}`);
    }

    // Map the results to include more readable status information
    // Note: skills is a plain text column, not an array
    return result.map((app) => ({
      id: app.id,
      role: app.skills || 'Volunteer',
      status: app.status === 'submitted' ? 'under_review' : app.status,
      event_name: 'BayaniHub Event',
      event_date: new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      application_id: app.id,
      created_at: app.applied_at,
    }));
  }

  async getUserDonations(donorAuthId: string) {
    this.logger.log(`[DEBUG] Fetching donations for user ID: ${donorAuthId}`);

    // Fetch donations for the authenticated user
    // Note: the timestamp column is 'donated_at', not 'created_at'
    const { data: result, error } = await this.client
      .from('donations')
      .select('id, campaign_id, status, item_name, quantity, unit, donated_at')
      .eq('donor_auth_id', donorAuthId)
      .order('donated_at', { ascending: false });
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    
    // Map the results
    return result.map((donation) => ({
      id: donation.id,
      type: 'donation',
      role: donation.item_name || 'Donation',
      status: donation.status,
      event_name: 'Goods Pledge',
      event_date: new Date(donation.donated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      created_at: donation.donated_at,
    }));
  }
}
