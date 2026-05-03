import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image,
  ScrollView, Dimensions, ActivityIndicator, Share, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/providers/auth-provider';
import { API_BASE } from '@/src/lib/api';

interface Application {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'pending';
  event_name?: string;
  event_date?: string;
  qr_code?: string;
  application_id?: string;
  role?: string;
  type?: string;
  created_at?: string;
}

const { width, height } = Dimensions.get('window');

const formatRefNumber = (id: string, prefix = 'APP') => {
  if (!id) return `${prefix}-0000-00000`;
  const year = new Date().getFullYear();
  const num = parseInt(id.replace(/-/g, '').slice(0, 6), 16) % 99999;
  return `${prefix}-${year}-${String(num).padStart(5, '0')}`;
};

const formatInstitutionalId = (firstName?: string, lastName?: string, seed?: string) => {
  const initials = `${(firstName?.[0] || 'U').toUpperCase()}${(lastName?.[0] || 'U').toUpperCase()}`;
  const year = new Date().getFullYear();
  const num = seed ? (parseInt(seed.replace(/-/g, '').slice(0, 4), 16) % 9000) + 1000 : 8892;
  return `${initials}-${year}-${num}`;
};

export function StatusScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const institutionalId = formatInstitutionalId(
    user?.profile?.first_name,
    user?.profile?.last_name,
    user?.id,
  );

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    fetchStatus();
  }, [user, token]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const [appRes, donRes] = await Promise.all([
        fetch(`${API_BASE}/forms/my-applications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/forms/my-donations`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (appRes.status === 401 || donRes.status === 401) { logout(); router.replace('/login'); return; }
      let all: Application[] = [];
      if (appRes.ok) { const d = await appRes.json(); if (d.success && Array.isArray(d.data)) all = [...all, ...d.data]; }
      if (donRes.ok) { const d = await donRes.json(); if (d.success && Array.isArray(d.data)) all = [...all, ...d.data]; }
      all.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setApplications(all);
      if (all.length > 0) setSelectedApp(all[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedApp?.qr_code) { Alert.alert('No QR Code', 'Your application has not been approved yet.'); return; }
    try { await Share.share({ message: `BayaniHub Digital Pass – ${selectedApp.event_name || 'BayaniHub Event'}`, url: selectedApp.qr_code }); }
    catch (e) { console.error(e); }
  };

  const renderHeader = () => (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} style={s.headerBack}>
        <Text style={s.headerBackIcon}>←</Text>
      </Pressable>
      <Text style={s.headerTitle}>BayaniHub</Text>
      <View style={s.avatarCircle}>
        <Text style={s.avatarText}>{(user?.profile?.first_name?.[0] || 'U').toUpperCase()}</Text>
      </View>
    </View>
  );

  const renderBottomNav = () => (
    <View style={s.bottomNav}>
      <Pressable style={s.navItem} onPress={() => router.push('/dashboard' as any)}>
        <Text style={s.navIcon}>⊞</Text>
        <Text style={s.navLabel}>Dashboard</Text>
      </Pressable>
      <Pressable style={[s.navItem, s.navItemActive]}>
        <Text style={[s.navIcon, s.navIconActive]}>📋</Text>
        <Text style={[s.navLabel, s.navLabelActive]}>Applications</Text>
      </Pressable>
      <Pressable style={s.navItem}>
        <Text style={s.navIcon}>📄</Text>
        <Text style={s.navLabel}>Documents</Text>
      </Pressable>
    </View>
  );


  // ── UNDER REVIEW ──
  const renderUnderReview = (app: Application) => {
    const ref = formatRefNumber(app.id);
    return (
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        <View style={s.welcomeSection}>
          <Text style={s.welcomeLabel}>WELCOME BACK</Text>
          <Text style={s.welcomeName}>{user?.profile?.first_name} {user?.profile?.last_name}</Text>
        </View>

        {/* Institutional ID Card */}
        <View style={s.idCard}>
          <View style={s.idCardTop}>
            <Text style={s.idCardLabel}>INSTITUTIONAL ID</Text>
            <View style={s.idCardVerifiedBadge}><Text style={s.idCardVerifiedText}>✓</Text></View>
          </View>
          <Text style={s.idCardNumber}>{institutionalId}</Text>
          <View style={s.idCardUserRow}>
            <View style={s.idCardDocIcon}><Text style={{ fontSize: 18 }}>📄</Text></View>
            <View>
              <Text style={s.idCardUserName}>{user?.profile?.first_name} {user?.profile?.last_name}</Text>
              <Text style={s.idCardUserRole}>Senior Citizen / Resident</Text>
            </View>
          </View>
        </View>

        {/* Review Status Card */}
        <View style={s.card}>
          <View style={s.reviewHeader}>
            <View style={s.reviewIconBox}><Text style={{ fontSize: 20 }}>⏳</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.reviewTitle}>Your Application is Under Review</Text>
              <Text style={s.reviewRef}>Ref: {ref}</Text>
            </View>
          </View>
          <View style={s.progressSection}>
            <View style={s.progressLabelRow}>
              <Text style={s.progressStage}>STAGE 2 OF 3</Text>
              <Text style={s.progressPercent}>66% Completed</Text>
            </View>
            <View style={s.progressBg}><View style={[s.progressFill, { width: '66%' }]} /></View>
            <Text style={s.progressNext}>Next step: Verification of Documents</Text>
          </View>
          <Pressable style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>View Submission Details</Text>
          </Pressable>
          <Pressable style={s.outlineBtn} onPress={() => Alert.alert('Support', 'Contact support team for assistance.')}>
            <Text style={s.outlineBtnIcon}>💬</Text>
            <Text style={s.outlineBtnText}>Contact Support</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statIcon}>📄</Text>
            <Text style={s.statTitle}>Documents</Text>
            <Text style={s.statValue}>4 Attached</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>🔔</Text>
            <Text style={s.statTitle}>Updates</Text>
            <Text style={s.statValue}>Last: 2h ago</Text>
          </View>
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoBoxIcon}>ℹ️</Text>
          <Text style={s.infoBoxText}>Institutional reviews typically take 3-5 business days. You will be notified via SMS.</Text>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    );
  };

  // ── APPROVED ──
  const renderApproved = (app: Application) => {
    const passId = `BH-${new Date().getFullYear()}-${String(parseInt(app.id.slice(0, 5), 16) % 99999).padStart(5, '0')}`;
    return (
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        {renderHeader()}

        <View style={s.approvedHero}>
          <View style={s.approvedCircle}><Text style={s.approvedCheck}>✓</Text></View>
          <Text style={s.approvedTitle}>Application Approved!</Text>
          <Text style={s.approvedSub}>Your event pass is ready to use.</Text>
        </View>

        {/* Event Pass Card */}
        <View style={s.eventPass}>
          <View style={s.eventPassTop}>
            <Text style={s.eventPassLabel}>EVENT PASS</Text>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
          </View>
          <Text style={s.eventPassName}>{app.event_name || 'BayaniHub Event'}</Text>
          <View style={s.eventPassDetails}>
            <View>
              <Text style={s.eventPassDetailLabel}>DATE</Text>
              <Text style={s.eventPassDetailValue}>{app.event_date || 'TBD'}</Text>
            </View>
            <View>
              <Text style={s.eventPassDetailLabel}>SEAT</Text>
              <Text style={s.eventPassDetailValue}>{app.role || 'Volunteer'}</Text>
            </View>
          </View>
        </View>

        {/* QR Code */}
        <View style={s.qrBox}>
          {app.qr_code ? (
            <Image source={{ uri: app.qr_code }} style={s.qrImage} resizeMode="contain" />
          ) : (
            <View style={s.qrPlaceholder}><Text style={s.qrPlaceholderText}>QR</Text></View>
          )}
          <Text style={s.qrHint}>Scan at the entrance kiosk</Text>
          <Text style={s.qrPassId}>PASS ID: {passId}</Text>
        </View>

        <View style={s.actionButtons}>
          <Pressable style={s.primaryBtn} onPress={() => Alert.alert('QR Code', 'QR code saved to your device.')}>
            <Text style={s.primaryBtnText}>⬇  Save QR Code</Text>
          </Pressable>
          <Pressable style={s.outlineBtn} onPress={handleShare}>
            <Text style={s.outlineBtnText}>⬆  Share Pass</Text>
          </Pressable>
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoBoxIcon}>ℹ️</Text>
          <Text style={s.infoBoxText}>Please present this digital pass along with a valid photo ID at the event venue for verification.</Text>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    );
  };

  // ── REJECTED ──
  const renderRejected = (app: Application) => {
    const appId = formatRefNumber(app.id, 'BH');
    return (
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        {renderHeader()}

        <View style={s.rejectedHero}>
          <View style={s.rejectedCircle}><Text style={s.rejectedX}>✕</Text></View>
          <Text style={s.rejectedTitle}>Application Not Approved</Text>
          <Text style={s.rejectedSub}>Unfortunately, your application was not accepted. Please contact support or re-apply.</Text>
        </View>

        <View style={s.actionButtons}>
          <Pressable style={s.primaryBtn} onPress={() => Alert.alert('Support', 'Contact support team for assistance.')}>
            <Text style={s.primaryBtnText}>Contact Support</Text>
          </Pressable>
          <Pressable style={s.outlineBtn} onPress={() => router.push('/about' as any)}>
            <Text style={s.outlineBtnText}>Review Guidelines</Text>
          </Pressable>
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoBoxIcon}>ℹ️</Text>
          <Text style={s.infoBoxText}>Please present this digital pass along with a valid photo ID at the event venue for verification.</Text>
        </View>

        <View style={s.appIdCard}>
          <View>
            <Text style={s.appIdLabel}>APPLICATION ID</Text>
            <Text style={s.appIdValue}>{appId}</Text>
          </View>
          <View style={s.appIdQr}><Text style={{ fontSize: 22, color: '#1E3A8A' }}>⊞</Text></View>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    );
  };

  // ── EMPTY ──
  const renderEmpty = () => (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {renderHeader()}
      <View style={s.emptyContainer}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>📋</Text>
        <Text style={s.rejectedTitle}>No Applications Yet</Text>
        <Text style={s.rejectedSub}>You haven't submitted any applications or pledges yet.</Text>
        <Pressable style={[s.primaryBtn, { marginTop: 20, width: '80%' }]} onPress={() => router.push('/volunteer' as any)}>
          <Text style={s.primaryBtnText}>Submit Application</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading your status...</Text>
      </View>
    );
  }

  const renderBody = () => {
    if (!selectedApp) return renderEmpty();
    const st = selectedApp.status;
    if (st === 'approved') return renderApproved(selectedApp);
    if (st === 'rejected') return renderRejected(selectedApp);
    return renderUnderReview(selectedApp);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      {renderBody()}
      {renderBottomNav()}
    </View>
  );
}

const NAVY = '#1E3A8A';
const NAVY_LIGHT = '#2563EB';
const GREEN = '#16A34A';
const RED = '#DC2626';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center' },
  headerBackIcon: { fontSize: 22, color: '#111827', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: NAVY },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Welcome
  welcomeSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  welcomeLabel: { fontSize: 11, fontWeight: '600', color: NAVY_LIGHT, letterSpacing: 1, marginBottom: 4 },
  welcomeName: { fontSize: 26, fontWeight: '800', color: '#111827' },

  // ID Card
  idCard: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 16,
    backgroundColor: NAVY, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  idCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  idCardLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  idCardVerifiedBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  idCardVerifiedText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  idCardNumber: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, marginBottom: 14 },
  idCardUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  idCardDocIcon: {
    width: 38, height: 38, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  idCardUserName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  idCardUserRole: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Generic Card
  card: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 16, backgroundColor: '#FFFFFF',
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },

  // Review
  reviewHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  reviewIconBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center',
  },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  reviewRef: { fontSize: 12, color: '#6B7280' },

  // Progress
  progressSection: { marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressStage: { fontSize: 11, fontWeight: '700', color: NAVY, letterSpacing: 0.5 },
  progressPercent: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: NAVY },
  progressNext: { fontSize: 11, color: '#6B7280', marginTop: 8 },

  // Buttons
  primaryBtn: {
    backgroundColor: NAVY, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1.5, borderColor: NAVY, borderRadius: 10, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8,
  },
  outlineBtnIcon: { fontSize: 14 },
  outlineBtnText: { color: NAVY, fontSize: 15, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 10 },
  statCard: {
    flex: 1, borderRadius: 10, backgroundColor: '#FFFFFF', padding: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statIcon: { fontSize: 16 },
  statTitle: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  statValue: { fontSize: 11, fontWeight: '700', color: '#374151' },

  // Info Box
  infoBox: {
    marginHorizontal: 20, marginTop: 10, borderRadius: 8,
    backgroundColor: '#F8FAFF', padding: 10, flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  infoBoxIcon: { fontSize: 12, marginTop: 1 },
  infoBoxText: { flex: 1, fontSize: 11, color: '#6B7280', lineHeight: 16 },

  // Approved
  approvedHero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  approvedCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  approvedCheck: { fontSize: 38, color: GREEN, fontWeight: '900' },
  approvedTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 6 },
  approvedSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  // Event Pass
  eventPass: {
    marginHorizontal: 20, borderRadius: 16, backgroundColor: NAVY, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5,
  },
  eventPassTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventPassLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 1 },
  eventPassName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  eventPassDetails: { flexDirection: 'row', gap: 40 },
  eventPassDetailLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 4 },
  eventPassDetailValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // QR
  qrBox: {
    marginHorizontal: 20, marginTop: 20, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  qrImage: { width: 200, height: 200, borderRadius: 8 },
  qrPlaceholder: {
    width: 200, height: 200, borderRadius: 8,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  qrPlaceholderText: { fontSize: 32, color: '#9CA3AF' },
  qrHint: { marginTop: 14, fontSize: 12, color: '#6B7280' },
  qrPassId: { marginTop: 6, fontSize: 12, fontWeight: '700', color: NAVY, letterSpacing: 0.5 },

  actionButtons: { marginHorizontal: 20, marginTop: 16 },

  // Rejected
  rejectedHero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  rejectedCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  rejectedX: { fontSize: 36, color: RED, fontWeight: '900' },
  rejectedTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  rejectedSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  // App ID Card
  appIdCard: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 14, backgroundColor: '#FFFFFF',
    padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  appIdLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5, marginBottom: 6 },
  appIdValue: { fontSize: 18, fontWeight: '800', color: NAVY },
  appIdQr: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, minHeight: height - 200 },


  // Bottom Nav
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingBottom: 20, paddingTop: 10,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navItemActive: {},
  navIcon: { fontSize: 20, color: '#9CA3AF' },
  navIconActive: { color: NAVY },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  navLabelActive: { color: NAVY },
});
