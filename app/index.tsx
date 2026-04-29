import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Color Palette from your specifications
const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  primaryBlue: '#3E5A99', 
  secondaryBlue: '#2965A2',
  lightBlue: '#5C6ED5',
  lighterBlue: '#5E70DC',
  accentTint: 'rgba(66, 101, 255, 0.08)', // #4265FF at 8%
  grayText: '#666666',
  lightGray: '#F5F6FA',
  border: '#E0E0E0',
  success: '#4CAF50',
  danger: '#F44336',
  dangerBg: '#FDECEB',
  successBg: '#E8F5E9',
};

export default function BayaniHubPrototype() {
  // Navigation State: 'dashboard' | 'approved' | 'rejected' | 'deployment'
  const [activeScreen, setActiveScreen] = useState('dashboard');

  const TopNavigation = () => (
    <View style={styles.header}>
      <TouchableOpacity>
        <Ionicons name="menu" size={28} color={COLORS.primaryBlue} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>BayaniHub</Text>
      <TouchableOpacity>
        <Ionicons name="person-circle" size={32} color={COLORS.black} />
      </TouchableOpacity>
    </View>
  );

  const BottomNavigation = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveScreen('dashboard')}>
        <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={activeScreen === 'dashboard' ? COLORS.primaryBlue : COLORS.grayText} />
        <Text style={[styles.navText, activeScreen === 'dashboard' && styles.navTextActive]}>Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveScreen('approved')}>
        <Ionicons name="document-text-outline" size={24} color={activeScreen === 'approved' || activeScreen === 'rejected' || activeScreen === 'deployment' ? COLORS.primaryBlue : COLORS.grayText} />
        <Text style={[styles.navText, (activeScreen === 'approved' || activeScreen === 'rejected' || activeScreen === 'deployment') && styles.navTextActive]}>Applications</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="folder-outline" size={24} color={COLORS.grayText} />
        <Text style={styles.navText}>Documents</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.welcomeText}>WELCOME BACK</Text>
      <Text style={styles.userName}>Maria Santos</Text>

      <View style={styles.idCard}>
        <Text style={styles.idCardLabel}>INSTITUTIONAL ID</Text>
        <View style={styles.idCardRow}>
          <Text style={styles.idCardNumber}>MS-2024-8892</Text>
          <MaterialCommunityIcons name="check-decagram" size={20} color={COLORS.white} />
        </View>
        <View style={styles.idDetails}>
          <Ionicons name="document-text" size={24} color={COLORS.white} />
          <View style={styles.idTextCol}>
            <Text style={styles.idName}>Maria L. Santos</Text>
            <Text style={styles.idRole}>Senior Citizen / Resident</Text>
          </View>
        </View>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="clipboard-outline" size={20} color={COLORS.primaryBlue} />
          </View>
          <View>
            <Text style={styles.reviewTitle}>Your Application is Under Review</Text>
            <Text style={styles.reviewRef}>Ref: APP-2026-00847</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.stageText}>STAGE 2 OF 3</Text>
            <Text style={styles.percentText}>66% Completed</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarLine, { width: '66%', backgroundColor: COLORS.lightBlue }]} />
            <View style={[styles.progressBarLine, { width: '34%', backgroundColor: COLORS.accentTint }]} />
          </View>
          <Text style={styles.nextStepText}>Next step: Verification of Documents</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveScreen('approved')}>
          <Text style={styles.primaryButtonText}>View Submission Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setActiveScreen('rejected')}>
          <Ionicons name="headset-outline" size={18} color={COLORS.primaryBlue} />
          <Text style={styles.secondaryButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.grayText} />
        <Text style={styles.infoText}>Institutional reviews typically take 3-5 business days. You will be notified via SMS.</Text>
      </View>
    </ScrollView>
  );

  const renderApproved = () => (
    <ScrollView style={styles.content}>
      <TouchableOpacity onPress={() => setActiveScreen('dashboard')} style={styles.backButton}>
         <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlue} />
      </TouchableOpacity>

      <View style={styles.centerStatus}>
        <View style={styles.successIconBg}>
          <Ionicons name="checkmark" size={32} color={COLORS.success} />
        </View>
        <Text style={styles.statusTitle}>Application Approved!</Text>
        <Text style={styles.statusSub}>Your event pass is ready for use.</Text>
      </View>

      <View style={styles.passCard}>
        <View style={styles.passHeader}>
          <Text style={styles.passLabel}>EVENT PASS</Text>
          <Ionicons name="cube-outline" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.passEventName}>Digital Tech Summit 2024</Text>
        <View style={styles.passDetailsRow}>
          <View>
            <Text style={styles.passDetailLabel}>DATE</Text>
            <Text style={styles.passDetailValue}>Oct 24, 2024</Text>
          </View>
          <View>
             <Text style={styles.passDetailLabel}>SEAT</Text>
             <Text style={styles.passDetailValue}>A-12 Premium</Text>
          </View>
        </View>
        
        {/* Trigger to view deployment details */}
        <TouchableOpacity style={styles.viewDetailsTrigger} onPress={() => setActiveScreen('deployment')}>
            <Text style={styles.viewDetailsText}>VIEW DEPLOYMENT DETAILS</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.qrContainer}>
          <MaterialCommunityIcons name="qrcode-scan" size={120} color={COLORS.black} />
          <Text style={styles.scanText}>Scan at the entrance kiosk</Text>
          <Text style={styles.passIdText}>PASS ID: BH-2024-00192</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton}>
        <Ionicons name="download-outline" size={18} color={COLORS.white} />
        <Text style={styles.primaryButtonText}> Save QR Code</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton}>
        <Ionicons name="share-social-outline" size={18} color={COLORS.primaryBlue} />
        <Text style={styles.secondaryButtonText}> Share Pass</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRejected = () => (
    <ScrollView style={styles.content}>
      <TouchableOpacity onPress={() => setActiveScreen('dashboard')} style={styles.backButton}>
         <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlue} />
      </TouchableOpacity>

      <View style={styles.centerStatus}>
        <View style={styles.dangerIconBg}>
          <Ionicons name="close" size={32} color={COLORS.danger} />
        </View>
        <Text style={styles.statusTitle}>Application Not Approved</Text>
        <Text style={styles.statusSub}>Unfortunately, your application was not accepted. Please contact support or re-apply.</Text>
      </View>

      <View style={{ marginTop: 40 }}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Review Guidelines</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { marginTop: 40 }]}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.primaryBlue} />
        <Text style={styles.infoText}>Please present this digital pass along with a valid photo ID at the event venue for verification.</Text>
      </View>
    </ScrollView>
  );

  const renderDeploymentDetails = () => (
    <ScrollView style={styles.content}>
      <View style={styles.deploymentHeaderRow}>
        <TouchableOpacity onPress={() => setActiveScreen('approved')}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.deploymentTitle}>DEPLOYMENT DETAILS</Text>
        <View style={{width: 24}} /> 
      </View>

      <View style={styles.deploymentCard}>
        <Text style={styles.detailLabel}>DEPLOYMENT LOCATION</Text>
        <Text style={styles.detailValueLarge}>Metro Relief Ops Center B, Taft Ave.</Text>

        <Text style={styles.detailLabel}>CALL TIME</Text>
        <Text style={styles.detailValue}>Oct 24, 2024 - 08:00 AM</Text>

        <Text style={styles.detailLabel}>SHIFT DURATION</Text>
        <Text style={styles.detailValue}>8 Hours (08:00 AM - 04:00 PM)</Text>

        <Text style={styles.detailLabel}>ROLE ASSIGNMENT</Text>
        <Text style={styles.detailValue}>Relief Pack Coordinator</Text>

        <Text style={styles.detailLabel}>SITE MANAGER</Text>
        <Text style={styles.detailValue}>Jane Doe, +63 912 345 6789</Text>

        <View style={styles.divider} />

        <Text style={styles.detailLabel}>INVENTORY RESPONSIBILITY</Text>
        
        <View style={styles.inventoryItem}>
          <View style={styles.inventoryIconBox}>
            <Ionicons name="medkit-outline" size={20} color={COLORS.primaryBlue} />
          </View>
          <View style={styles.inventoryTextCol}>
            <Text style={styles.inventoryTitle}>Medical Supplies</Text>
            <Text style={styles.inventorySub}>12 items</Text>
          </View>
          <Ionicons name="add" size={24} color={COLORS.black} />
        </View>

        <View style={styles.inventoryItem}>
          <View style={styles.inventoryIconBox}>
            <Ionicons name="water-outline" size={20} color={COLORS.primaryBlue} />
          </View>
          <View style={styles.inventoryTextCol}>
            <Text style={styles.inventoryTitle}>Hygiene Packs</Text>
            <Text style={styles.inventorySub}>20 items</Text>
          </View>
          <Ionicons name="add" size={24} color={COLORS.black} />
        </View>

        <View style={styles.inventoryItem}>
          <View style={styles.inventoryIconBox}>
            <Ionicons name="fast-food-outline" size={20} color={COLORS.primaryBlue} />
          </View>
          <View style={styles.inventoryTextCol}>
            <Text style={styles.inventoryTitle}>Food Rations</Text>
            <Text style={styles.inventorySub}>10 items</Text>
          </View>
          <Ionicons name="add" size={24} color={COLORS.black} />
        </View>

      </View>

      <TouchableOpacity style={[styles.primaryButton, { marginTop: 20 }]}>
        <Text style={styles.primaryButtonText}>CHECK-IN AT SITE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigation />
      {activeScreen === 'dashboard' && renderDashboard()}
      {activeScreen === 'approved' && renderApproved()}
      {activeScreen === 'rejected' && renderRejected()}
      {activeScreen === 'deployment' && renderDeploymentDetails()}
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryBlue,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondaryBlue,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 20,
  },
  idCard: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  idCardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginBottom: 5,
  },
  idCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  idCardNumber: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  idDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
  },
  idTextCol: {
    marginLeft: 10,
  },
  idName: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  idRole: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  reviewTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.black,
  },
  reviewRef: {
    fontSize: 12,
    color: COLORS.grayText,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primaryBlue,
  },
  percentText: {
    fontSize: 12,
    color: COLORS.grayText,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarLine: {
    height: '100%',
  },
  nextStepText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.grayText,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    padding: 15,
    borderRadius: 8,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: COLORS.grayText,
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 10,
    color: COLORS.grayText,
    marginTop: 4,
  },
  navTextActive: {
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
  },
  backButton: {
    marginBottom: 20,
  },
  centerStatus: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  dangerIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  statusSub: {
    fontSize: 14,
    color: COLORS.grayText,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  passCard: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  passLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    letterSpacing: 1,
  },
  passEventName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  passDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  passDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginBottom: 4,
  },
  passDetailValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewDetailsTrigger: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  viewDetailsText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 5,
  },
  qrContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  scanText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 15,
    marginBottom: 5,
  },
  passIdText: {
    fontSize: 10,
    color: COLORS.grayText,
    letterSpacing: 1,
  },
  deploymentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  deploymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryBlue,
  },
  deploymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.grayText,
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 15,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  detailValueLarge: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  inventoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.accentTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  inventoryTextCol: {
    flex: 1,
  },
  inventoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  inventorySub: {
    fontSize: 12,
    color: COLORS.grayText,
  }
});