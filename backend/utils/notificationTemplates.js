// Notification templates (static file)
// Each template should have: id, title, message, type, action
module.exports = {
  WELCOME: {
    id: 'WELCOME',
    title: 'Welcome to EquiLife',
    message: 'Welcome to EquiLife — your companion for balanced wellbeing. Explore features, set goals, and start your journey!',
    type: 'info',
    action: { name: 'open_welcome', target: null }
  },
  PROFILE_REMINDER: {
    id: 'PROFILE_REMINDER',
    title: 'Complete your profile',
    message: 'Complete or update your profile so we can personalize your recommendations. Open Settings to update your details.',
    type: 'reminder',
    action: { name: 'open_settings', target: 'settings_modal' }
  },
  WEEKLY_ASSESSMENT: {
    id: 'WEEKLY_ASSESSMENT',
    title: 'Weekly Mental Health Check-in',
    message: 'It\'s time for your weekly mental health assessment. Share how you\'re feeling to get tailored suggestions.',
    type: 'reminder',
    action: { name: 'open_assessment', target: '/assessment' }
  },
  BIWEEKLY_FITNESS: {
    id: 'BIWEEKLY_FITNESS',
    title: 'Update Fitness & Meals',
    message: 'Has your fitness routine or meals changed recently? Update your activity and meal logs to keep recommendations accurate.',
    type: 'reminder',
    action: { name: 'open_fitness', target: '/fitness' }
  }
};
