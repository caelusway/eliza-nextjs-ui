// UI Configuration System
// This file provides a centralized way to manage UI text and settings through environment variables

export interface UIConfig {
  seo: {
    title: string;
    description: string;
    keywords: string;
    author: string;
    faviconUrl: string;
    logoUrl: string;
    ogImage: string;
    twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
    themeColor: string;
  };
  branding: {
    appName: string;
    description: string;
    logoAlt: string;
    primaryColor: string;
  };
  login: {
    heroTitle: string;
    heroSubtitle: string;
    welcomeTitle: string;
    welcomeDescription: string;
    initializingText: string;
    loadingText: string;
    redirectingText: string;
    verifyingAccountText: string;
    validatingInviteText: string;
    signingInText: string;
    inviteRequiredError: string;
  };
  hero: {
    title: string;
    subtitle?: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    signInButtonText: string;
    signingInText: string;
    existingUserText: string;
    inviteCodeLabel: string;
    inviteCodePlaceholder: string;
    continueButtonText: string;
    validatingText: string;
    authenticatingText: string;
    verifyingText: string;
    privacyText: string;
    privacyLinkText: string;
  };
  navigation: {
    homeText: string;
    chatText: string;
    accountText: string;
    aboutText: string;
    termsText: string;
    privacyText: string;
    invitesText: string;
  };
  chat: {
    newChatText: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    inputPlaceholder: string;
    sendButtonAlt: string;
    tryAskingText: string;
    newChatPlaceholder: string;
    creatingSessionText: string;
    suggestedPrompts: string[];
    previewTitle: string;
    previewSubtitle: string;
    previewSlides: Array<{
      userMessage: string;
      aiResponse: string;
    }>;
  };
  loginSlider: {
    showChatContent: boolean;
    backgroundImage: string;
    backgroundAlt: string;
    autoPlay: boolean;
    interval: number;
    transitionDuration: number;
  };
  loginBranding: {
    logoImage: string;
    logoAlt: string;
    logoWidth: number;
    logoHeight: number;
  };
  errors: {
    genericError: string;
    connectionError: string;
    authError: string;
    validationError: string;
  };
  actions: {
    saveText: string;
    cancelText: string;
    deleteText: string;
    editText: string;
    shareText: string;
    copyText: string;
    downloadText: string;
    uploadText: string;
  };
  status: {
    loadingText: string;
    savingText: string;
    savedText: string;
    errorText: string;
    successText: string;
  };
  features: {
    deepResearchEnabled: boolean;
    speechToTextEnabled: boolean;
    fileUploadEnabled: boolean;
    inviteSystemEnabled: boolean;
  };
  content: {
    aboutTitle: string;
    aboutDescription: string;
    projectName: string;
    projectDescription: string;
    researchButtonText: string;
    launchButtonText: string;
  };
  social: {
    discordEnabled: boolean;
    telegramEnabled: boolean;
    twitterEnabled: boolean;
  };
  sidebar: {
    recentChatsText: string;
    accountButtonTitle: string;
    inviteButtonTitle: string;
    newChatText: string;
    creatingText: string;
    logOutText: string;
    connectedText: string;
    connectingText: string;
    publicChatTitle: string;
    publicChatDescription: string;
    privateChatTitle: string;
    privateChatDescription: string;
    inviteFriendsText: string;
    accountText: string;
    expandSidebarTitle: string;
    collapseSidebarTitle: string;
    closeMobileMenuTitle: string;
  };
  account: {
    pageTitle: string;
    pageDescription: string;
    refreshText: string;
    profileSectionTitle: string;
    logoutText: string;
    emailLabel: string;
    userIdLabel: string;
    inviteManagementTitle: string;
    codesRemainingText: string;
    copyText: string;
    linkText: string;
    sendText: string;
    noInviteCodesText: string;
    invitedUsersTitle: string;
    sendInviteDialogTitle: string;
    inviteCodeLabel: string;
    yourNameLabel: string;
    yourNamePlaceholder: string;
    emailAddressLabel: string;
    emailPlaceholder: string;
    cancelText: string;
    sendingText: string;
    inviteCodeCopiedText: string;
    inviteLinkCopiedText: string;
    refreshedDataText: string;
    inviteSentText: string;
    sendInviteErrorText: string;
    legacyText: string;
    usesText: string;
  };
}

// Default configuration with fallbacks
const DEFAULT_CONFIG: UIConfig = {
  seo: {
    title:
      process.env.NEXT_PUBLIC_SEO_TITLE || '{appName} - AI-powered longevity research assistant',
    description:
      process.env.NEXT_PUBLIC_SEO_DESCRIPTION ||
      "Expert AI guidance from Dr. Aubrey de Grey's research. Join thousands exploring longevity science with AI-powered insights.",
    keywords:
      process.env.NEXT_PUBLIC_SEO_KEYWORDS ||
      'longevity, anti-aging, AI research, health optimization, life extension, biotechnology',
    author: process.env.NEXT_PUBLIC_SEO_AUTHOR || 'AUBRAI Team',
    faviconUrl: process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico',
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '/assets/logo_text.png',
    ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || '/og-image.png',
    twitterCard:
      (process.env.NEXT_PUBLIC_TWITTER_CARD as
        | 'summary'
        | 'summary_large_image'
        | 'app'
        | 'player') || 'summary_large_image',
    themeColor: process.env.NEXT_PUBLIC_THEME_COLOR || '#FF6E71',
  },
  branding: {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'AUBRAI',
    description:
      process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'AI-powered longevity research assistant',
    logoAlt: process.env.NEXT_PUBLIC_LOGO_ALT || 'AUBRAI Logo',
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#FF6E71',
  },
  login: {
    heroTitle: process.env.NEXT_PUBLIC_LOGIN_HERO_TITLE || 'Your longevity co-pilot',
    heroSubtitle:
      process.env.NEXT_PUBLIC_LOGIN_HERO_SUBTITLE ||
      "Expert AI guidance from Dr. Aubrey de Grey's research.",
    welcomeTitle: process.env.NEXT_PUBLIC_LOGIN_WELCOME_TITLE || 'Welcome to {appName}',
    welcomeDescription:
      process.env.NEXT_PUBLIC_LOGIN_WELCOME_DESCRIPTION ||
      'Join thousands exploring longevity science with AI-powered insights from cutting-edge research.',
    initializingText: process.env.NEXT_PUBLIC_LOGIN_INITIALIZING_TEXT || 'Initializing...',
    loadingText: process.env.NEXT_PUBLIC_LOGIN_LOADING_TEXT || 'Loading...',
    redirectingText: process.env.NEXT_PUBLIC_LOGIN_REDIRECTING_TEXT || 'Redirecting you...',
    verifyingAccountText: process.env.NEXT_PUBLIC_LOGIN_VERIFYING_TEXT || 'Verifying account...',
    validatingInviteText: process.env.NEXT_PUBLIC_LOGIN_VALIDATING_TEXT || 'Validating invite...',
    signingInText: process.env.NEXT_PUBLIC_LOGIN_SIGNING_IN_TEXT || 'Signing you in...',
    inviteRequiredError:
      process.env.NEXT_PUBLIC_LOGIN_INVITE_REQUIRED_ERROR ||
      'You need an invite code to access {appName}. Please enter your invite code below.',
  },
  hero: {
    title: process.env.NEXT_PUBLIC_HERO_TITLE || 'Breaking the\n50-Year Longevity Barrier',
    subtitle: process.env.NEXT_PUBLIC_HERO_SUBTITLE,
  },
  auth: {
    loginTitle: process.env.NEXT_PUBLIC_LOGIN_TITLE || 'Welcome Back',
    loginSubtitle:
      process.env.NEXT_PUBLIC_LOGIN_SUBTITLE || 'Sign in to continue your research journey',
    signInButtonText: process.env.NEXT_PUBLIC_SIGN_IN_TEXT || 'Already a user? Sign in',
    signingInText: process.env.NEXT_PUBLIC_SIGNING_IN_TEXT || 'Signing in...',
    existingUserText: process.env.NEXT_PUBLIC_EXISTING_USER_TEXT || 'Already a user? Sign in',
    inviteCodeLabel: process.env.NEXT_PUBLIC_INVITE_CODE_LABEL || 'Invite Code',
    inviteCodePlaceholder:
      process.env.NEXT_PUBLIC_INVITE_CODE_PLACEHOLDER || 'Enter your invite code',
    continueButtonText: process.env.NEXT_PUBLIC_CONTINUE_BUTTON_TEXT || 'Continue with invite',
    validatingText: process.env.NEXT_PUBLIC_VALIDATING_TEXT || 'Validating...',
    authenticatingText: process.env.NEXT_PUBLIC_AUTHENTICATING_TEXT || 'Authenticating...',
    verifyingText: process.env.NEXT_PUBLIC_VERIFYING_TEXT || 'Verifying your account...',
    privacyText:
      process.env.NEXT_PUBLIC_PRIVACY_TEXT || "By continuing, you acknowledge {appName}'s",
    privacyLinkText: process.env.NEXT_PUBLIC_PRIVACY_LINK_TEXT || 'Privacy Policy',
  },
  navigation: {
    homeText: process.env.NEXT_PUBLIC_NAV_HOME || 'Home',
    chatText: process.env.NEXT_PUBLIC_NAV_CHAT || 'Chat',
    accountText: process.env.NEXT_PUBLIC_NAV_ACCOUNT || 'Account',
    aboutText: process.env.NEXT_PUBLIC_NAV_ABOUT || 'About',
    termsText: process.env.NEXT_PUBLIC_NAV_TERMS || 'Terms',
    privacyText: process.env.NEXT_PUBLIC_NAV_PRIVACY || 'Privacy',
    invitesText: process.env.NEXT_PUBLIC_NAV_INVITES || 'Invites',
  },
  chat: {
    newChatText: process.env.NEXT_PUBLIC_NEW_CHAT_TEXT || 'New Chat',
    welcomeTitle: process.env.NEXT_PUBLIC_WELCOME_TITLE || 'Welcome to {appName}',
    welcomeSubtitle:
      process.env.NEXT_PUBLIC_WELCOME_SUBTITLE || 'Your AI research assistant is ready to help',
    inputPlaceholder: process.env.NEXT_PUBLIC_INPUT_PLACEHOLDER || 'Type your message here...',
    sendButtonAlt: process.env.NEXT_PUBLIC_SEND_BUTTON_ALT || 'Send message',
    tryAskingText: process.env.NEXT_PUBLIC_TRY_ASKING_TEXT || 'Try asking about:',
    newChatPlaceholder:
      process.env.NEXT_PUBLIC_NEW_CHAT_PLACEHOLDER ||
      'Ask me anything about longevity research, anti-aging therapies, or health optimization...',
    creatingSessionText:
      process.env.NEXT_PUBLIC_CREATING_SESSION_TEXT || 'Creating chat session...',
    suggestedPrompts: (
      process.env.NEXT_PUBLIC_SUGGESTED_PROMPTS ||
      'What drug combinations show synergistic effects for longevity?,Analyze the latest research on NAD+ precursors,Design a compound targeting cellular senescence,Find clinical trials for age-related diseases'
    ).split(','),
    previewTitle: process.env.NEXT_PUBLIC_CHAT_PREVIEW_TITLE || 'Chat with {appName}',
    previewSubtitle:
      process.env.NEXT_PUBLIC_CHAT_PREVIEW_SUBTITLE ||
      'See how {appName} helps with longevity research',
    previewSlides: parseChatSlides(
      process.env.NEXT_PUBLIC_CHAT_PREVIEW_SLIDES ||
        'How do DNA methylation clocks relate to biological aging?|DNA methylation clocks are powerful biomarkers that measure biological age by analyzing methylation patterns at specific CpG sites. The Horvath clock uses 353 CpG sites and correlates strongly with chronological age (r=0.96). More advanced clocks like GrimAge predict mortality risk and healthspan.;What are the main goals of the RMR2 project?|The Robust Mouse Rejuvenation 2 (RMR2) project aims to double the remaining lifespan of middle-aged mice through combination interventions. Key strategies include cellular reprogramming, senolytic drugs, telomerase activation, NAD+ restoration, and mitochondrial rejuvenation.;Are dasatinib and quercetin effective senolytics?|Yes, the dasatinib + quercetin (D+Q) combination is one of the most validated senolytic interventions. In mice, D+Q extends healthspan, improves physical function, and reduces senescent cell burden by 30-70% depending on tissue type.;Rapamycin vs metformin for longevity - which is better?|Rapamycin shows stronger evidence for lifespan extension. In the ITP studies, rapamycin consistently extends median lifespan by 10-15% in mice when started late in life. It works via mTOR inhibition, enhancing autophagy and stress resistance.'
    ),
  },
  loginSlider: {
    showChatContent: process.env.NEXT_PUBLIC_LOGIN_SLIDER_SHOW_CHAT_CONTENT !== 'false',
    backgroundImage:
      process.env.NEXT_PUBLIC_LOGIN_SLIDER_BACKGROUND_IMAGE || '/assets/aubrai-login-image.png',
    backgroundAlt: process.env.NEXT_PUBLIC_LOGIN_SLIDER_BACKGROUND_ALT || 'Login background image',
    autoPlay: process.env.NEXT_PUBLIC_LOGIN_SLIDER_AUTO_PLAY !== 'false',
    interval: parseInt(process.env.NEXT_PUBLIC_LOGIN_SLIDER_INTERVAL || '6000'),
    transitionDuration: parseInt(process.env.NEXT_PUBLIC_LOGIN_SLIDER_TRANSITION_DURATION || '700'),
  },
  loginBranding: {
    logoImage: process.env.NEXT_PUBLIC_LOGIN_LOGO_IMAGE || '/assets/logo_text.png',
    logoAlt: process.env.NEXT_PUBLIC_LOGIN_LOGO_ALT || 'AUBRAI Logo',
    logoWidth: parseInt(process.env.NEXT_PUBLIC_LOGIN_LOGO_WIDTH || '180'),
    logoHeight: parseInt(process.env.NEXT_PUBLIC_LOGIN_LOGO_HEIGHT || '45'),
  },
  errors: {
    genericError:
      process.env.NEXT_PUBLIC_GENERIC_ERROR || 'Something went wrong. Please try again.',
    connectionError:
      process.env.NEXT_PUBLIC_CONNECTION_ERROR || 'Connection error. Please check your internet.',
    authError: process.env.NEXT_PUBLIC_AUTH_ERROR || 'Authentication failed. Please try again.',
    validationError:
      process.env.NEXT_PUBLIC_VALIDATION_ERROR || 'Please check your input and try again.',
  },
  actions: {
    saveText: process.env.NEXT_PUBLIC_SAVE_TEXT || 'Save',
    cancelText: process.env.NEXT_PUBLIC_CANCEL_TEXT || 'Cancel',
    deleteText: process.env.NEXT_PUBLIC_DELETE_TEXT || 'Delete',
    editText: process.env.NEXT_PUBLIC_EDIT_TEXT || 'Edit',
    shareText: process.env.NEXT_PUBLIC_SHARE_TEXT || 'Share',
    copyText: process.env.NEXT_PUBLIC_COPY_TEXT || 'Copy',
    downloadText: process.env.NEXT_PUBLIC_DOWNLOAD_TEXT || 'Download',
    uploadText: process.env.NEXT_PUBLIC_UPLOAD_TEXT || 'Upload',
  },
  status: {
    loadingText: process.env.NEXT_PUBLIC_LOADING_TEXT || 'Loading...',
    savingText: process.env.NEXT_PUBLIC_SAVING_TEXT || 'Saving...',
    savedText: process.env.NEXT_PUBLIC_SAVED_TEXT || 'Saved!',
    errorText: process.env.NEXT_PUBLIC_ERROR_TEXT || 'Error',
    successText: process.env.NEXT_PUBLIC_SUCCESS_TEXT || 'Success!',
  },
  features: {
    deepResearchEnabled: process.env.NEXT_PUBLIC_DEEP_RESEARCH_ENABLED === 'true',
    speechToTextEnabled: process.env.NEXT_PUBLIC_SPEECH_TO_TEXT_ENABLED !== 'false',
    fileUploadEnabled: process.env.NEXT_PUBLIC_FILE_UPLOAD_ENABLED !== 'false',
    inviteSystemEnabled: process.env.NEXT_PUBLIC_INVITE_SYSTEM_ENABLED !== 'false',
  },
  content: {
    aboutTitle: process.env.NEXT_PUBLIC_ABOUT_TITLE || 'What is {appName}?',
    aboutDescription:
      process.env.NEXT_PUBLIC_ABOUT_DESCRIPTION ||
      'A groundbreaking AI agent that serves as your digital research assistant.',
    projectName: process.env.NEXT_PUBLIC_PROJECT_NAME || 'RMR2 Project',
    projectDescription:
      process.env.NEXT_PUBLIC_PROJECT_DESCRIPTION ||
      'Robust Mouse Rejuvenation project – an ambitious endeavor in longevity science.',
    researchButtonText: process.env.NEXT_PUBLIC_RESEARCH_BUTTON_TEXT || 'Explore the research',
    launchButtonText: process.env.NEXT_PUBLIC_LAUNCH_BUTTON_TEXT || 'Launch {appName}',
  },
  social: {
    discordEnabled: process.env.NEXT_PUBLIC_DISCORD_ENABLED !== 'false',
    telegramEnabled: process.env.NEXT_PUBLIC_TELEGRAM_ENABLED !== 'false',
    twitterEnabled: process.env.NEXT_PUBLIC_TWITTER_ENABLED !== 'false',
  },
  sidebar: {
    recentChatsText: process.env.NEXT_PUBLIC_SIDEBAR_RECENT_CHATS_TEXT || 'Recent Chats',
    accountButtonTitle: process.env.NEXT_PUBLIC_SIDEBAR_ACCOUNT_TITLE || 'Account',
    inviteButtonTitle: process.env.NEXT_PUBLIC_SIDEBAR_INVITE_TITLE || 'Invite Friends',
    newChatText: process.env.NEXT_PUBLIC_SIDEBAR_NEW_CHAT_TEXT || 'New Chat',
    creatingText: process.env.NEXT_PUBLIC_SIDEBAR_CREATING_TEXT || 'Creating...',
    logOutText: process.env.NEXT_PUBLIC_SIDEBAR_LOGOUT_TEXT || 'Log Out',
    connectedText: process.env.NEXT_PUBLIC_SIDEBAR_CONNECTED_TEXT || 'Connected',
    connectingText: process.env.NEXT_PUBLIC_SIDEBAR_CONNECTING_TEXT || 'Connecting...',
    publicChatTitle: process.env.NEXT_PUBLIC_SIDEBAR_PUBLIC_CHAT_TITLE || 'Public Chat',
    publicChatDescription: process.env.NEXT_PUBLIC_SIDEBAR_PUBLIC_CHAT_DESC || 'Chat with everyone',
    privateChatTitle: process.env.NEXT_PUBLIC_SIDEBAR_PRIVATE_CHAT_TITLE || 'Private Chat',
    privateChatDescription:
      process.env.NEXT_PUBLIC_SIDEBAR_PRIVATE_CHAT_DESC || 'Chat with {appName} privately',
    inviteFriendsText: process.env.NEXT_PUBLIC_SIDEBAR_INVITE_FRIENDS_TEXT || 'Invite Friends',
    accountText: process.env.NEXT_PUBLIC_SIDEBAR_ACCOUNT_TEXT || 'Account',
    expandSidebarTitle: process.env.NEXT_PUBLIC_SIDEBAR_EXPAND_TITLE || 'Expand sidebar',
    collapseSidebarTitle: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSE_TITLE || 'Collapse sidebar',
    closeMobileMenuTitle: process.env.NEXT_PUBLIC_SIDEBAR_CLOSE_MENU_TITLE || 'Close mobile menu',
  },
  account: {
    pageTitle: process.env.NEXT_PUBLIC_ACCOUNT_PAGE_TITLE || 'Account',
    pageDescription:
      process.env.NEXT_PUBLIC_ACCOUNT_PAGE_DESCRIPTION || 'Manage your profile and invitations',
    refreshText: process.env.NEXT_PUBLIC_ACCOUNT_REFRESH_TEXT || 'Refresh',
    profileSectionTitle: process.env.NEXT_PUBLIC_ACCOUNT_PROFILE_TITLE || 'Profile Information',
    logoutText: process.env.NEXT_PUBLIC_ACCOUNT_LOGOUT_TEXT || 'Logout',
    emailLabel: process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_LABEL || 'Email',
    userIdLabel: process.env.NEXT_PUBLIC_ACCOUNT_USER_ID_LABEL || 'User ID',
    inviteManagementTitle:
      process.env.NEXT_PUBLIC_ACCOUNT_INVITE_MANAGEMENT_TITLE || 'Invite Management',
    codesRemainingText: process.env.NEXT_PUBLIC_ACCOUNT_CODES_REMAINING_TEXT || 'codes remaining',
    copyText: process.env.NEXT_PUBLIC_ACCOUNT_COPY_TEXT || 'Copy',
    linkText: process.env.NEXT_PUBLIC_ACCOUNT_LINK_TEXT || 'Link',
    sendText: process.env.NEXT_PUBLIC_ACCOUNT_SEND_TEXT || 'Send',
    noInviteCodesText:
      process.env.NEXT_PUBLIC_ACCOUNT_NO_INVITE_CODES_TEXT || 'No invite codes available',
    invitedUsersTitle: process.env.NEXT_PUBLIC_ACCOUNT_INVITED_USERS_TITLE || 'Invited Users',
    sendInviteDialogTitle:
      process.env.NEXT_PUBLIC_ACCOUNT_SEND_INVITE_DIALOG_TITLE || 'Send Invite',
    inviteCodeLabel: process.env.NEXT_PUBLIC_ACCOUNT_INVITE_CODE_LABEL || 'Invite Code',
    yourNameLabel: process.env.NEXT_PUBLIC_ACCOUNT_YOUR_NAME_LABEL || 'Your Name (optional)',
    yourNamePlaceholder: process.env.NEXT_PUBLIC_ACCOUNT_YOUR_NAME_PLACEHOLDER || 'Enter your name',
    emailAddressLabel: process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_ADDRESS_LABEL || 'Email Address',
    emailPlaceholder: process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_PLACEHOLDER || 'friend@example.com',
    cancelText: process.env.NEXT_PUBLIC_ACCOUNT_CANCEL_TEXT || 'Cancel',
    sendingText: process.env.NEXT_PUBLIC_ACCOUNT_SENDING_TEXT || 'Sending...',
    inviteCodeCopiedText:
      process.env.NEXT_PUBLIC_ACCOUNT_INVITE_CODE_COPIED_TEXT || 'Invite code copied!',
    inviteLinkCopiedText:
      process.env.NEXT_PUBLIC_ACCOUNT_INVITE_LINK_COPIED_TEXT || 'Invite link copied!',
    refreshedDataText:
      process.env.NEXT_PUBLIC_ACCOUNT_REFRESHED_DATA_TEXT || 'Refreshed invite data',
    inviteSentText: process.env.NEXT_PUBLIC_ACCOUNT_INVITE_SENT_TEXT || 'Invite sent successfully!',
    sendInviteErrorText:
      process.env.NEXT_PUBLIC_ACCOUNT_SEND_INVITE_ERROR_TEXT || 'Error sending invite',
    legacyText: process.env.NEXT_PUBLIC_ACCOUNT_LEGACY_TEXT || 'Legacy',
    usesText: process.env.NEXT_PUBLIC_ACCOUNT_USES_TEXT || 'uses',
  },
};

// Helper function to parse chat slides from environment variable
function parseChatSlides(envVar: string): Array<{ userMessage: string; aiResponse: string }> {
  try {
    // Expected format: "Question1|Answer1;Question2|Answer2;Question3|Answer3"
    return envVar.split(';').map((slide) => {
      const [userMessage, aiResponse] = slide.split('|');
      return {
        userMessage: userMessage?.trim() || '',
        aiResponse: aiResponse?.trim() || '',
      };
    });
  } catch (error) {
    console.warn('Failed to parse chat slides from environment variable');
    return [];
  }
}

// Template string replacement helper
function processTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

// Process templates in the config
function processConfigTemplates(config: UIConfig): UIConfig {
  const variables = {
    appName: config.branding.appName,
  };

  return {
    ...config,
    seo: {
      ...config.seo,
      title: processTemplate(config.seo.title, variables),
    },
    auth: {
      ...config.auth,
      privacyText: processTemplate(config.auth.privacyText, variables),
    },
    login: {
      ...config.login,
      welcomeTitle: processTemplate(config.login.welcomeTitle, variables),
      inviteRequiredError: processTemplate(config.login.inviteRequiredError, variables),
    },
    chat: {
      ...config.chat,
      welcomeTitle: processTemplate(config.chat.welcomeTitle, variables),
      previewTitle: processTemplate(config.chat.previewTitle, variables),
      previewSubtitle: processTemplate(config.chat.previewSubtitle, variables),
    },
    content: {
      ...config.content,
      aboutTitle: processTemplate(config.content.aboutTitle, variables),
      launchButtonText: processTemplate(config.content.launchButtonText, variables),
    },
    sidebar: {
      ...config.sidebar,
      privateChatDescription: processTemplate(config.sidebar.privateChatDescription, variables),
    },
  };
}

// Export the processed configuration
export const uiConfig: UIConfig = processConfigTemplates(DEFAULT_CONFIG);

// Export individual sections for convenience
export const {
  seo,
  branding,
  hero,
  auth,
  login,
  navigation,
  chat,
  loginSlider,
  loginBranding,
  errors,
  actions,
  status,
  features,
  content,
  social,
} = uiConfig;
