import { useCallback, useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { useAuthStore } from '@/store/authStore';

export interface InviteDoc {
  id: string;
  fromUserId: string;
  fromEmail: string;
  toEmail: string;
  toUserId?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: any;
}

export interface LinkedContact {
  uid: string;
  email: string;
}

export interface UseFamilyLinkResult {
  linkedContact: LinkedContact | null;
  incomingInvites: InviteDoc[];
  outgoingInvites: InviteDoc[];
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  sendInvite: (targetEmail: string) => Promise<void>;
  acceptInvite: (invite: InviteDoc) => Promise<void>;
  declineInvite: (invite: InviteDoc) => Promise<void>;
  unlinkContact: () => Promise<void>;
  clearError: () => void;
}

export function useFamilyLink(): UseFamilyLinkResult {
  const user = useAuthStore((state) => state.user);

  const [linkedContact, setLinkedContact] = useState<LinkedContact | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<InviteDoc[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<InviteDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync user profile (email & emailLower) to Firestore on mount/user change
  useEffect(() => {
    if (!user || !user.email) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    setDoc(
      userRef,
      {
        email: user.email,
        emailLower: user.email.toLowerCase(),
      },
      { merge: true }
    ).catch((err) => console.error('Error syncing user profile to Firestore:', err));
  }, [user]);

  // Subscribe to user document for linkedUserId changes
  useEffect(() => {
    if (!user) {
      setLinkedContact(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);

    const unsubscribeUser = onSnapshot(
      userRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const linkedId = data?.linkedUserId as string | undefined;

          if (linkedId) {
            try {
              const linkedDoc = await getDoc(doc(db, 'users', linkedId));
              if (linkedDoc.exists()) {
                const linkedData = linkedDoc.data();
                setLinkedContact({
                  uid: linkedId,
                  email: linkedData?.email || 'Family Member',
                });
              } else {
                setLinkedContact({ uid: linkedId, email: 'Family Member' });
              }
            } catch (e) {
              console.error('Error fetching linked user profile:', e);
              setLinkedContact({ uid: linkedId, email: 'Family Member' });
            }
          } else {
            setLinkedContact(null);
          }
        } else {
          setLinkedContact(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error listening to user document:', err);
        setError('Failed to load user link status.');
        setIsLoading(false);
      }
    );

    return () => unsubscribeUser();
  }, [user]);

  // Subscribe to incoming pending invites
  useEffect(() => {
    if (!user || !user.email) {
      setIncomingInvites([]);
      return;
    }

    const db = getFirestore();
    const userEmailLower = user.email.toLowerCase();

    const q = query(
      collection(db, 'invites'),
      where('toEmail', '==', userEmailLower),
      where('status', '==', 'pending')
    );

    const unsubscribeInvites = onSnapshot(
      q,
      (snapshot) => {
        const invites: InviteDoc[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<InviteDoc, 'id'>),
        }));
        setIncomingInvites(invites);
      },
      (err) => {
        console.error('Error listening to incoming invites:', err);
      }
    );

    return () => unsubscribeInvites();
  }, [user]);

  // Subscribe to outgoing pending invites
  useEffect(() => {
    if (!user) {
      setOutgoingInvites([]);
      return;
    }

    const db = getFirestore();
    const q = query(
      collection(db, 'invites'),
      where('fromUserId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeOutgoing = onSnapshot(
      q,
      (snapshot) => {
        const invites: InviteDoc[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<InviteDoc, 'id'>),
        }));
        setOutgoingInvites(invites);
      },
      (err) => {
        console.error('Error listening to outgoing invites:', err);
      }
    );

    return () => unsubscribeOutgoing();
  }, [user]);

  // Send an invite
  const sendInvite = useCallback(
    async (rawTargetEmail: string) => {
      if (!user || !user.email) {
        setError('You must be signed in to send invites.');
        return;
      }

      const targetEmail = rawTargetEmail.trim().toLowerCase();
      if (!targetEmail) {
        setError('Please enter an email address.');
        return;
      }

      if (targetEmail === user.email.toLowerCase()) {
        setError('You cannot invite yourself.');
        return;
      }

      if (linkedContact) {
        setError('You are already linked to a family member. Unlink first before inviting another.');
        return;
      }

      setIsActionLoading(true);
      setError(null);

      try {
        const db = getFirestore();

        const userQuery = query(collection(db, 'users'), where('emailLower', '==', targetEmail));
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          setError('No account found with that email. Make sure they have registered for HomeSafe.');
          setIsActionLoading(false);
          return;
        }

        const targetUserDoc = userSnap.docs[0];
        const targetUserId = targetUserDoc.id;
        const targetUserData = targetUserDoc.data();

        if (targetUserData.linkedUserId) {
          setError('This user is already linked to another family member.');
          setIsActionLoading(false);
          return;
        }

        const inviteCheckQuery = query(
          collection(db, 'invites'),
          where('fromUserId', '==', user.uid),
          where('toEmail', '==', targetEmail),
          where('status', '==', 'pending')
        );
        const inviteCheckSnap = await getDocs(inviteCheckQuery);

        if (!inviteCheckSnap.empty) {
          setError('An invite has already been sent to this email.');
          setIsActionLoading(false);
          return;
        }

        const newInviteRef = doc(collection(db, 'invites'));
        await setDoc(newInviteRef, {
          fromUserId: user.uid,
          fromEmail: user.email,
          toEmail: targetEmail,
          toUserId: targetUserId,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.error('Error sending invite:', err);
        setError(err.message || 'Failed to send invite. Please try again.');
      } finally {
        setIsActionLoading(false);
      }
    },
    [user, linkedContact]
  );

  // Accept an invite
  const acceptInvite = useCallback(
    async (invite: InviteDoc) => {
      if (!user) return;

      if (linkedContact) {
        setError('You are already linked to a family member. Unlink first before accepting.');
        return;
      }

      setIsActionLoading(true);
      setError(null);

      try {
        const db = getFirestore();

        const inviterDoc = await getDoc(doc(db, 'users', invite.fromUserId));
        if (inviterDoc.exists() && inviterDoc.data()?.linkedUserId) {
          setError('This user has already linked with someone else.');
          setIsActionLoading(false);
          return;
        }

        await setDoc(doc(db, 'users', user.uid), { linkedUserId: invite.fromUserId }, { merge: true });
        await setDoc(doc(db, 'users', invite.fromUserId), { linkedUserId: user.uid }, { merge: true });
        await updateDoc(doc(db, 'invites', invite.id), { status: 'accepted' });
      } catch (err: any) {
        console.error('Error accepting invite:', err);
        setError(err.message || 'Failed to accept invite. Please try again.');
      } finally {
        setIsActionLoading(false);
      }
    },
    [user, linkedContact]
  );

  // Decline an invite
  const declineInvite = useCallback(
    async (invite: InviteDoc) => {
      if (!user) return;

      setIsActionLoading(true);
      setError(null);

      try {
        const db = getFirestore();
        await updateDoc(doc(db, 'invites', invite.id), { status: 'declined' });
      } catch (err: any) {
        console.error('Error declining invite:', err);
        setError(err.message || 'Failed to decline invite.');
      } finally {
        setIsActionLoading(false);
      }
    },
    [user]
  );

  // Unlink contact
  const unlinkContact = useCallback(async () => {
    if (!user || !linkedContact) return;

    setIsActionLoading(true);
    setError(null);

    try {
      const db = getFirestore();
      const otherUserId = linkedContact.uid;

      await setDoc(doc(db, 'users', user.uid), { linkedUserId: null }, { merge: true });
      await setDoc(doc(db, 'users', otherUserId), { linkedUserId: null }, { merge: true });

      setLinkedContact(null);
    } catch (err: any) {
      console.error('Error unlinking contact:', err);
      setError(err.message || 'Failed to unlink contact.');
    } finally {
      setIsActionLoading(false);
    }
  }, [user, linkedContact]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
  };
}
