// Authentication state is operational, never coursework evidence or seed data.
export const operationalCollections = ['adminSession', 'adminLoginAttempt'];
export function assessmentCollections(collections) {
  return collections.filter(({ name }) => !name.startsWith('system.') && !operationalCollections.includes(name));
}
