import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
  FlatList,
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

export function StatusScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchApplicationStatus();
  }, [user, token]);

  const fetchApplicationStatus = async () => {
    try {
      setLoading(true);
      if (!token) return;

      // Fetch both volunteer applications and donations
      const [appResponse, donResponse] = await Promise.all([
        fetch(`${API_BASE}/forms/my-applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE}/forms/my-donations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (appResponse.status === 401 || donResponse.status === 401) {
        logout();
        router.replace('/login');
        return;
      }

      let allApplications: Application[] = [];

      if (appResponse.ok) {
        const appData = await appResponse.json();
        if (appData.success && appData.data && Array.isArray(appData.data)) {
          allApplications = [...allApplications, ...appData.data];
        }
      }

      if (donResponse.ok) {
        const donData = await donResponse.json();
        if (donData.success && donData.data && Array.isArray(donData.data)) {
          allApplications = [...allApplications, ...donData.data];
        }
      }

      if (allApplications.length > 0) {
        // Sort by created_at, most recent first
        allApplications.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setApplications(allApplications);
        setSelectedApplication(allApplications[0]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load application status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplicationStatus();
  };

  const handleSharePass = async () => {
    if (!selectedApplication?.qr_code) {
      Alert.alert('No QR Code', 'Your application has not been approved yet.');
      return;
    }

    try {
      await Share.share({
        message: `Check out my BayaniHub Digital Pass! Event: ${selectedApplication.event_name || 'BayaniHub Event'}`,
        url: selectedApplication.qr_code,
        title: 'BayaniHub Digital Pass',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownloadQR = () => {
    if (!selectedApplication?.qr_code) {
      Alert.alert('No QR Code', 'Your application has not been approved yet.');
      return;
    }
    Alert.alert('QR Code', 'QR code image downloaded to your device.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#D1FAE5', text: '#059669', icon: '✓' };
      case 'under_review':
      case 'submitted':
        return { bg: '#FEF3C7', text: '#B45309', icon: '⏳' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#DC2626', icon: '✕' };
      default:
        return { bg: '#E5E7EB', text: '#374151', icon: '?' };
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Application Approved!';
      case 'under_review':
      case 'submitted':
        return 'Your Application is Under Review';
      case 'rejected':
        return 'Application Not Approved';
      case 'pending':
        return 'Donation Pending';
      default:
        return 'Application Status Unknown';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Your event pass is ready to use.';
      case 'under_review':
      case 'submitted':
        return 'Institutional reviews typically take 3-5 business days. You will be notified via SMS.';
      case 'rejected':
        return 'Unfortunately, your application was not accepted. Please review guidelines or contact support.';
      case 'pending':
        return 'Your donation is being reviewed and prepared for delivery.';
      default:
        return 'Unable to determine application status.';
    }
  };

  const statusColor = selectedApplication ? getStatusColor(selectedApplication.status) : getStatusColor('unknown');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.5 }]}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>Status</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* WELCOME SECTION */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
        <Text style={styles.userName}>
          {user?.profile?.first_name} {user?.profile?.last_name}
        </Text>
      </View>

      {/* LOADING STATE */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B71CA" />
          <Text style={styles.loadingText}>Loading your application status...</Text>
        </View>
      ) : applications.length > 0 && selectedApplication ? (
        <>
          {/* STATUS CARD */}
          <View style={[styles.statusCard, { borderTopColor: statusColor.text }]}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusIcon, { color: statusColor.text }]}>
                {statusColor.icon}
              </Text>
            </View>
            <Text style={styles.statusTitle}>{getStatusTitle(selectedApplication.status)}</Text>
            <Text style={styles.statusMessage}>{getStatusMessage(selectedApplication.status)}</Text>
          </View>

          {/* EVENT DETAILS (if approved) */}
          {selectedApplication.status === 'approved' && (
            <View style={styles.eventCard}>
              <Text style={styles.eventLabel}>EVENT PASS</Text>
              <Text style={styles.eventName}>{selectedApplication.event_name || 'BayaniHub Event'}</Text>
              {selectedApplication.event_date && (
                <View style={styles.eventInfoRow}>
                  <Text style={styles.eventInfoLabel}>DATE</Text>
                  <Text style={styles.eventInfoValue}>{selectedApplication.event_date}</Text>
                </View>
              )}
              {selectedApplication.role && (
                <View style={styles.eventInfoRow}>
                  <Text style={styles.eventInfoLabel}>ROLE</Text>
                  <Text style={styles.eventInfoValue}>{selectedApplication.role}</Text>
                </View>
              )}
            </View>
          )}

          {/* QR CODE SECTION (if approved) */}
          {selectedApplication.status === 'approved' && selectedApplication.qr_code && (
            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <Image
                  source={{ uri: selectedApplication.qr_code }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
                <Text style={styles.qrHint}>Scan at the entrance kiosk</Text>
              </View>

              <View style={styles.actionButtonsContainer}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, styles.downloadButton, pressed && { opacity: 0.7 }]}
                  onPress={handleDownloadQR}
                >
                  <Text style={styles.downloadIcon}>⬇️</Text>
                  <Text style={styles.actionButtonText}>Save QR Code</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.actionButton, styles.shareButton, pressed && { opacity: 0.7 }]}
                  onPress={handleSharePass}
                >
                  <Text style={styles.shareIcon}>📤</Text>
                  <Text style={styles.actionButtonText}>Share Pass</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* NOT APPROVED MESSAGE */}
          {selectedApplication.status === 'rejected' && (
            <View style={styles.notApprovedContainer}>
              <View style={styles.notApprovedIcon}>
                <Text style={styles.notApprovedX}>✕</Text>
              </View>
              <Text style={styles.notApprovedTitle}>Application Not Approved</Text>
              <Text style={styles.notApprovedMessage}>
                Unfortunately, your application was not accepted. Please review the guidelines.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.supportButton, pressed && { opacity: 0.7 }]}
                onPress={() => Alert.alert('Support', 'Contact support team for assistance.')}
              >
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.guidelinesButton, pressed && { opacity: 0.7 }]}
                onPress={() => router.push('/about' as any)}
              >
                <Text style={styles.guidelinesButtonText}>Review Guidelines</Text>
              </Pressable>
            </View>
          )}

          {/* APPLICATIONS LIST */}
          {applications.length > 1 && (
            <View style={styles.applicationsSection}>
              <Text style={styles.applicationsSectionTitle}>Your Applications</Text>
              <FlatList
                data={applications}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.applicationItem,
                      selectedApplication.id === item.id && styles.applicationItemSelected,
                    ]}
                    onPress={() => setSelectedApplication(item)}
                  >
                    <View style={styles.appItemContent}>
                      <Text style={styles.appItemTitle}>{item.event_name || item.role}</Text>
                      <Text style={styles.appItemDate}>{item.event_date}</Text>
                    </View>
                    <View
                      style={[
                        styles.appItemStatusBadge,
                        { backgroundColor: getStatusColor(item.status).bg },
                      ]}
                    >
                      <Text style={{ color: getStatusColor(item.status).text, fontWeight: '600', fontSize: 11 }}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* ADDITIONAL INFO */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📄</Text>
              <Text style={styles.infoLabel}>Applications</Text>
              <Text style={styles.infoValue}>{applications.length}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Submitted</Text>
              <Text style={styles.infoValue}>Recently</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📋</Text>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>Active</Text>
            </View>
          </View>

          {/* REFRESH AND LOGOUT */}
          <View style={styles.bottomButtons}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
              onPress={handleRefresh}
            >
              <Text style={styles.secondaryButtonText}>
                {refreshing ? 'Refreshing...' : 'Refresh Status'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
              onPress={() => {
                logout();
                router.replace('/login');
              }}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        </>
      ) : (
        /* NO APPLICATION */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Applications Yet</Text>
          <Text style={styles.emptyMessage}>
            You haven't submitted any applications or pledges yet.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/volunteer' as any)}
          >
            <Text style={styles.emptyButtonText}>Submit Application</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backIcon: {
    fontSize: 24,
    color: '#111827',
    fontWeight: 'bold',
  },

  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#F9FAFB',
  },

  welcomeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 5,
    letterSpacing: 0.5,
  },

  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height - 300,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#6B7280',
  },

  statusCard: {
    marginHorizontal: 20,
    marginTop: 30,
    borderTopWidth: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'center',
  },

  statusIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },

  statusMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  eventCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    padding: 20,
  },

  eventLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B71CA',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 15,
  },

  eventInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  eventInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B71CA',
    flex: 1,
  },

  eventInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
    textAlign: 'right',
  },

  qrContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },

  qrBox: {
    width: 220,
    height: 220,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qrImage: {
    width: 200,
    height: 200,
  },

  qrHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  downloadButton: {
    backgroundColor: '#3B71CA',
    borderWidth: 1,
    borderColor: '#3B71CA',
  },

  shareButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B71CA',
  },

  downloadIcon: {
    fontSize: 16,
  },

  shareIcon: {
    fontSize: 16,
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  shareButton: {
    borderWidth: 1,
    borderColor: '#3B71CA',
  },

  notApprovedContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
    padding: 20,
  },

  notApprovedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  notApprovedX: {
    fontSize: 40,
    color: '#DC2626',
    fontWeight: 'bold',
  },

  notApprovedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },

  notApprovedMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3B71CA',
    marginBottom: 10,
    width: '100%',
  },

  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  guidelinesButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B71CA',
    width: '100%',
  },

  guidelinesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B71CA',
    textAlign: 'center',
  },

  applicationsSection: {
    marginHorizontal: 20,
    marginTop: 30,
  },

  applicationsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  applicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  applicationItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B71CA',
  },

  appItemContent: {
    flex: 1,
  },

  appItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  appItemDate: {
    fontSize: 11,
    color: '#6B7280',
  },

  appItemStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 10,
  },

  infoSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 30,
    gap: 15,
  },

  infoCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  infoIcon: {
    fontSize: 24,
    marginBottom: 5,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },

  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 30,
  },

  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  logoutButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: height - 200,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },

  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },

  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3B71CA',
  },

  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
