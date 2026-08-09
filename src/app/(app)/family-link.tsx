import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFamilyLink } from '@/hooks/use-family-link';

export default function FamilyLinkScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [targetEmail, setTargetEmail] = useState('');

  const {
    linkedContact,
    incomingInvites,
    outgoingInvites,
    isLoading,
    isActionLoading,
    error,
    sendInvite,
    acceptInvite,
    declineInvite,
    unlinkContact,
    clearError,
  } = useFamilyLink();

  const handleSendInvite = async () => {
    if (!targetEmail.trim() || isActionLoading) return;
    await sendInvite(targetEmail);
    setTargetEmail('');
  };

  const handleEmailChange = (text: string) => {
    if (error) clearError();
    setTargetEmail(text);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Pressable
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
                onPress={() => router.back()}
              >
                <ThemedText type="smallBold" style={{ color: '#3c87f7' }}>
                  ← Back
                </ThemedText>
              </Pressable>
              <ThemedText type="subtitle" style={styles.title}>
                Link Family Member
              </ThemedText>
            </View>

            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.text} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
                  Loading family link status...
                </ThemedText>
              </View>
            ) : (
              <View style={styles.content}>
                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: '#FFD2D2' }]}>
                    <ThemedText style={{ color: '#D8000C', fontSize: 14 }}>
                      {error}
                    </ThemedText>
                  </View>
                ) : null}

                {linkedContact ? (
                  <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <ThemedText type="subtitle" style={styles.cardHeader}>
                      Linked Contact
                    </ThemedText>
                    <ThemedText type="default" style={styles.linkedEmail}>
                      {linkedContact.email}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Your accounts are linked. Arrival notifications will be shared with this contact.
                    </ThemedText>

                    <Pressable
                      style={({ pressed }) => [
                        styles.unlinkButton,
                        pressed && !isActionLoading && { opacity: 0.7 },
                      ]}
                      onPress={unlinkContact}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator color="#FF3B30" size="small" />
                      ) : (
                        <ThemedText type="smallBold" style={{ color: '#FF3B30' }}>
                          Unlink Account
                        </ThemedText>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.unlinkedSection}>
                    {/* Incoming Invites Section */}
                    {incomingInvites.length > 0 ? (
                      <View style={styles.section}>
                        <ThemedText type="smallBold" style={styles.sectionTitle}>
                          Pending Invitations
                        </ThemedText>
                        {incomingInvites.map((invite) => (
                          <View
                            key={invite.id}
                            style={[
                              styles.inviteCard,
                              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                            ]}
                          >
                            <ThemedText type="default" style={{ fontWeight: '600' }}>
                              {invite.fromEmail}
                            </ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                              wants to link family accounts with you.
                            </ThemedText>

                            <View style={styles.inviteButtonRow}>
                              <Pressable
                                style={({ pressed }) => [
                                  styles.acceptButton,
                                  pressed && !isActionLoading && { opacity: 0.8 },
                                ]}
                                onPress={() => acceptInvite(invite)}
                                disabled={isActionLoading}
                              >
                                {isActionLoading ? (
                                  <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                                    Accept
                                  </ThemedText>
                                )}
                              </Pressable>

                              <Pressable
                                style={({ pressed }) => [
                                  styles.declineButton,
                                  pressed && !isActionLoading && { opacity: 0.7 },
                                ]}
                                onPress={() => declineInvite(invite)}
                                disabled={isActionLoading}
                              >
                                <ThemedText type="smallBold" style={{ color: theme.text }}>
                                  Decline
                                </ThemedText>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {/* Send Invite Form */}
                    <View style={styles.section}>
                      <ThemedText type="smallBold" style={styles.sectionTitle}>
                        Invite a Family Member
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Enter the registered email address of the family member you wish to link.
                      </ThemedText>

                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.backgroundElement,
                            color: theme.text,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                        placeholder="family.member@example.com"
                        placeholderTextColor={theme.textSecondary}
                        value={targetEmail}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isActionLoading}
                      />

                      <Pressable
                        style={({ pressed }) => [
                          styles.primaryButton,
                          { backgroundColor: isActionLoading ? theme.backgroundSelected : theme.text },
                          pressed && !isActionLoading && { opacity: 0.8 },
                        ]}
                        onPress={handleSendInvite}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator color={theme.background} />
                        ) : (
                          <ThemedText
                            type="default"
                            style={{ color: theme.background, fontWeight: '600' }}
                          >
                            Send Invite
                          </ThemedText>
                        )}
                      </Pressable>
                    </View>

                    {/* Outgoing Invites Section */}
                    {outgoingInvites.length > 0 ? (
                      <View style={styles.section}>
                        <ThemedText type="smallBold" style={styles.sectionTitle}>
                          Sent Invites (Pending)
                        </ThemedText>
                        {outgoingInvites.map((invite) => (
                          <View
                            key={invite.id}
                            style={[
                              styles.inviteCard,
                              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                            ]}
                          >
                            <ThemedText type="default" style={{ fontWeight: '600' }}>
                              To: {invite.toEmail}
                            </ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                              Waiting for them to accept your invitation...
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: BottomTabInset + Spacing.three,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  backButton: {
    paddingRight: Spacing.three,
    paddingVertical: Spacing.one,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  content: {
    flex: 1,
    gap: Spacing.four,
  },
  errorBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardHeader: {
    fontSize: 20,
    lineHeight: 28,
  },
  linkedEmail: {
    fontSize: 18,
    fontWeight: '600',
  },
  unlinkButton: {
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  unlinkedSection: {
    gap: Spacing.five,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    marginTop: Spacing.one,
  },
  primaryButton: {
    height: 48,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.one,
  },
  inviteCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.one,
  },
  inviteButtonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  acceptButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#34C759',
    borderRadius: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    flex: 1,
    height: 40,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8E8E93',
    borderRadius: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
