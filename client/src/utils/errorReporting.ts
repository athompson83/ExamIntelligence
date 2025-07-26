/**
 * Utility functions for contextual error reporting
 * Use these in components when features fail to load or functions error out
 */

/**
 * Report a feature failure - triggers the conditional bug reporter
 * @param featureName - Name of the feature that failed
 * @param error - The error that occurred (optional)
 * @param context - Additional context about what the user was trying to do
 */
export function reportFeatureFailure(featureName: string, error?: Error, context?: string) {
  console.error(`Feature failure: ${featureName}`, error);
  
  // Trigger the global bug reporter if available
  if ((window as any).reportBug) {
    (window as any).reportBug(error, `${featureName}: ${context || 'Feature failed to load or execute'}`);
  }
}

/**
 * Report an API failure - for when API calls fail
 * @param endpoint - The API endpoint that failed
 * @param error - The error response
 * @param action - What the user was trying to do
 */
export function reportApiFailure(endpoint: string, error: any, action?: string) {
  console.error(`API failure: ${endpoint}`, error);
  
  const errorMessage = error?.message || error?.toString() || 'Unknown API error';
  const featureName = `API: ${endpoint}`;
  const context = action ? `User was trying to: ${action}` : 'API request failed';
  
  reportFeatureFailure(featureName, new Error(errorMessage), context);
}

/**
 * Report a component crash - for when React components fail to render
 * @param componentName - Name of the component that crashed
 * @param error - The error that caused the crash
 */
export function reportComponentCrash(componentName: string, error: Error) {
  console.error(`Component crash: ${componentName}`, error);
  
  reportFeatureFailure(`Component: ${componentName}`, error, 'Component failed to render properly');
}

/**
 * Report a user action failure - for when user interactions fail
 * @param action - Description of what the user was trying to do
 * @param error - The error that occurred
 * @param element - The UI element involved (optional)
 */
export function reportUserActionFailure(action: string, error: Error, element?: string) {
  console.error(`User action failure: ${action}`, error);
  
  const context = element ? `User clicked/interacted with: ${element}` : 'User action failed';
  reportFeatureFailure(`User Action: ${action}`, error, context);
}

/**
 * Example usage in components:
 * 
 * // When an API call fails:
 * try {
 *   const data = await fetch('/api/quizzes');
 * } catch (error) {
 *   reportApiFailure('/api/quizzes', error, 'load quiz list');
 * }
 * 
 * // When a feature doesn't work:
 * const handleSaveQuiz = () => {
 *   try {
 *     // ... save logic
 *   } catch (error) {
 *     reportFeatureFailure('Quiz Save', error, 'User clicked save button');
 *   }
 * };
 * 
 * // In error boundaries:
 * componentDidCatch(error, errorInfo) {
 *   reportComponentCrash(this.constructor.name, error);
 * }
 */