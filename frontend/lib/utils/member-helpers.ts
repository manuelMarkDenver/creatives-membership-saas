/**
 * Helper functions for member name handling and data compatibility
 */

/**
 * Get display name for a member
 * Priority: member.name > firstName + lastName > email
 */
export function getDisplayName(member: any): string {
  if (member?.name?.trim()) {
    return member.name.trim()
  }
  
  const firstName = member?.firstName || ''
  const lastName = member?.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()
  
  if (fullName) {
    return fullName
  }
  
  return member?.email || 'Unknown Member'
}

/**
 * Split a full name into first and last name
 * First token = firstName, remaining tokens = lastName
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName?.trim()) {
    return { firstName: '', lastName: '' }
  }
  
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] || ''
  const lastName = parts.slice(1).join(' ') || ''
  
  return { firstName, lastName }
}

/**
 * Build member payload for API compatibility
 * Maintains backward compatibility with firstName/lastName fields
 */
export function buildMemberPayload(formData: any): any {
  const { name, ...rest } = formData
  
  // If name is provided, split it for backward compatibility
  const { firstName, lastName } = splitName(name)
  
  const payload = {
    ...rest,
    name: name?.trim() || undefined,
    firstName: firstName || rest.firstName || undefined,
    lastName: lastName || rest.lastName || undefined,
  }
  
  // Remove undefined values
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key]
    }
  })
  
  return payload
}

/**
 * Check if member has legacy firstName/lastName fields
 */
export function hasLegacyNameFields(member: any): boolean {
  return !member?.name && (member?.firstName || member?.lastName)
}

/**
 * Convert legacy member to new format with name field
 */
export function normalizeMemberName(member: any): any {
  if (!member) return member
  
  if (member.name) {
    return member
  }
  
  const firstName = member.firstName || ''
  const lastName = member.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()
  
  return {
    ...member,
    name: fullName || undefined,
  }
}