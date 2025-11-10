// Domain Admin Assignment Service
// SuperAdmin assigns domains to Admins

import { firestore } from '../firestore';
import type { DomainAdminAssignment } from '../../types/domain-admin';

const COLLECTION = 'domain_admin_assignments';

/**
 * Get admin's assigned domains
 */
export async function getAdminDomains(adminUserId: string): Promise<string[]> {
  try {
    const doc = await firestore
      .collection(COLLECTION)
      .doc(adminUserId)
      .get();
    
    if (!doc.exists) {
      console.log(`ℹ️ No domain assignments for admin: ${adminUserId}`);
      return [];
    }
    
    const data = doc.data();
    return data?.assignedDomains || [];
    
  } catch (error) {
    console.error('❌ Error getting admin domains:', error);
    return [];
  }
}

/**
 * Assign domains to admin (SuperAdmin only)
 */
export async function assignDomainsToAdmin(
  adminUserId: string,
  adminEmail: string,
  adminName: string,
  domains: string[],
  assignedBy: string
): Promise<DomainAdminAssignment> {
  
  const assignment: Omit<DomainAdminAssignment, 'id'> = {
    adminUserId,
    adminEmail,
    adminName,
    assignedDomains: domains,
    assignedAt: new Date(),
    assignedBy,
    isActive: true,
    permissions: {
      canConfigureExperts: true,
      canViewAnalytics: true,
      canManageUsers: true,
      canShareAgents: true
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    source: getEnvironmentSource()
  };
  
  await firestore
    .collection(COLLECTION)
    .doc(adminUserId)
    .set(assignment);
  
  console.log('✅ Domains assigned to admin:', {
    adminUserId,
    domains: domains.length
  });
  
  return {
    id: adminUserId,
    ...assignment
  };
}

/**
 * Add domain to admin's assignments
 */
export async function addDomainToAdmin(
  adminUserId: string,
  domain: string
): Promise<void> {
  
  const currentDomains = await getAdminDomains(adminUserId);
  
  if (currentDomains.includes(domain)) {
    console.log('ℹ️ Admin already has access to domain:', domain);
    return;
  }
  
  await firestore
    .collection(COLLECTION)
    .doc(adminUserId)
    .update({
      assignedDomains: [...currentDomains, domain],
      updatedAt: new Date()
    });
  
  console.log('✅ Domain added to admin:', { adminUserId, domain });
}

/**
 * Remove domain from admin's assignments
 */
export async function removeDomainFromAdmin(
  adminUserId: string,
  domain: string
): Promise<void> {
  
  const currentDomains = await getAdminDomains(adminUserId);
  const newDomains = currentDomains.filter(d => d !== domain);
  
  await firestore
    .collection(COLLECTION)
    .doc(adminUserId)
    .update({
      assignedDomains: newDomains,
      updatedAt: new Date()
    });
  
  console.log('✅ Domain removed from admin:', { adminUserId, domain });
}

/**
 * Get all admins for a domain
 */
export async function getDomainAdmins(domain: string): Promise<DomainAdminAssignment[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('assignedDomains', 'array-contains', domain)
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      assignedAt: doc.data().assignedAt?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as DomainAdminAssignment[];
    
  } catch (error) {
    console.error('❌ Error getting domain admins:', error);
    return [];
  }
}

function getEnvironmentSource(): 'localhost' | 'production' {
  return process.env.NODE_ENV === 'production' ? 'production' : 'localhost';
}

