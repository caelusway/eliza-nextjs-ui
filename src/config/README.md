# UI Configuration System

The UI Configuration system provides a centralized way to manage all UI text, settings, and feature flags through environment variables. This makes the application highly customizable without requiring code changes.

## Features

- ✅ **Environment Variable Based**: All configuration through `NEXT_PUBLIC_*` environment variables
- ✅ **TypeScript Support**: Full type safety with TypeScript interfaces
- ✅ **Template Variables**: Support for dynamic text replacement (e.g., `{appName}`)
- ✅ **Feature Flags**: Boolean flags for enabling/disabling features
- ✅ **Fallback Values**: Default values when environment variables are not set
- ✅ **React Hooks**: Convenient hooks for accessing configuration in components
- ✅ **Modular Structure**: Organized by logical sections (auth, navigation, content, etc.)

## Quick Start

### 1. Set Environment Variables

Copy the configuration template to your `.env.local` file:

```bash
cp src/config/ui-config.env.example .env.local
```

### 2. Use in Components

```tsx
import { useUIConfigSection } from '@/hooks/use-ui-config';

function MyComponent() {
  const authConfig = useUIConfigSection('auth');

  return <button>{authConfig.signInButtonText}</button>;
}
```

## Available Hooks

### `useUIConfig()`

Returns the complete UI configuration object.

```tsx
const config = useUIConfig();
console.log(config.branding.appName);
```

### `useUIConfigSection(section)`

Returns a specific section of the configuration.

```tsx
const authConfig = useUIConfigSection('auth');
const navigationConfig = useUIConfigSection('navigation');
```

### `useFeatureFlags()`

Returns all feature flags.

```tsx
const features = useFeatureFlags();
if (features.deepResearchEnabled) {
  // Show deep research feature
}
```

### `useFeatureFlag(feature)`

Returns a specific feature flag value.

```tsx
const isEnabled = useFeatureFlag('speechToTextEnabled');
```

### `useBranding()`

Returns branding configuration.

```tsx
const branding = useBranding();
return <img alt={branding.logoAlt} />;
```

## Configuration Sections

### Branding

- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_DESCRIPTION` - Application description
- `NEXT_PUBLIC_LOGO_ALT` - Logo alt text
- `NEXT_PUBLIC_PRIMARY_COLOR` - Primary brand color (hex format, e.g., #FF6E71)

### Hero Section

- `NEXT_PUBLIC_HERO_TITLE` - Main hero title (supports `\n` for line breaks)
- `NEXT_PUBLIC_HERO_SUBTITLE` - Optional subtitle

### Login Page

- `NEXT_PUBLIC_LOGIN_HERO_TITLE` - Main hero title on login page
- `NEXT_PUBLIC_LOGIN_HERO_SUBTITLE` - Hero subtitle on login page
- `NEXT_PUBLIC_LOGIN_WELCOME_TITLE` - Welcome message title (supports `{appName}` template)
- `NEXT_PUBLIC_LOGIN_WELCOME_DESCRIPTION` - Welcome message description
- `NEXT_PUBLIC_LOGIN_INITIALIZING_TEXT` - Loading text during initialization
- `NEXT_PUBLIC_LOGIN_LOADING_TEXT` - General loading text
- `NEXT_PUBLIC_LOGIN_REDIRECTING_TEXT` - Text shown when redirecting
- `NEXT_PUBLIC_LOGIN_VERIFYING_TEXT` - Text shown when verifying account
- `NEXT_PUBLIC_LOGIN_VALIDATING_TEXT` - Text shown when validating invite
- `NEXT_PUBLIC_LOGIN_SIGNING_IN_TEXT` - Text shown when signing in
- `NEXT_PUBLIC_LOGIN_INVITE_REQUIRED_ERROR` - Error message for missing invite (supports `{appName}` template)

### Authentication

- `NEXT_PUBLIC_LOGIN_TITLE` - Login page title
- `NEXT_PUBLIC_SIGN_IN_TEXT` - Sign in button text
- `NEXT_PUBLIC_INVITE_CODE_LABEL` - Invite code input label
- `NEXT_PUBLIC_CONTINUE_BUTTON_TEXT` - Continue button text
- And many more auth-related texts...

### Navigation

- `NEXT_PUBLIC_NAV_HOME` - Home navigation text
- `NEXT_PUBLIC_NAV_CHAT` - Chat navigation text
- `NEXT_PUBLIC_NAV_ABOUT` - About navigation text
- etc.

### Chat

- `NEXT_PUBLIC_NEW_CHAT_TEXT` - New chat button text
- `NEXT_PUBLIC_WELCOME_TITLE` - Chat welcome title (supports `{appName}` template)
- `NEXT_PUBLIC_WELCOME_SUBTITLE` - Chat welcome subtitle/description
- `NEXT_PUBLIC_INPUT_PLACEHOLDER` - Message input placeholder
- `NEXT_PUBLIC_SEND_BUTTON_ALT` - Send button alt text
- `NEXT_PUBLIC_TRY_ASKING_TEXT` - "Try asking about:" section header
- `NEXT_PUBLIC_NEW_CHAT_PLACEHOLDER` - New chat textarea placeholder
- `NEXT_PUBLIC_CREATING_SESSION_TEXT` - Loading text when creating chat session
- `NEXT_PUBLIC_SUGGESTED_PROMPTS` - Comma-separated suggested prompts for new chat
- `NEXT_PUBLIC_CHAT_PREVIEW_TITLE` - Chat preview header title (supports `{appName}` template)
- `NEXT_PUBLIC_CHAT_PREVIEW_SUBTITLE` - Chat preview header subtitle (supports `{appName}` template)
- `NEXT_PUBLIC_CHAT_PREVIEW_SLIDES` - Chat preview slide content (see format below)

### Feature Flags

- `NEXT_PUBLIC_DEEP_RESEARCH_ENABLED` - Enable/disable deep research (default: false)
- `NEXT_PUBLIC_SPEECH_TO_TEXT_ENABLED` - Enable/disable speech-to-text (default: true)
- `NEXT_PUBLIC_FILE_UPLOAD_ENABLED` - Enable/disable file uploads (default: true)
- `NEXT_PUBLIC_INVITE_SYSTEM_ENABLED` - Enable/disable invite system (default: true)

### Social Features

- `NEXT_PUBLIC_DISCORD_ENABLED` - Enable Discord integration
- `NEXT_PUBLIC_TELEGRAM_ENABLED` - Enable Telegram integration
- `NEXT_PUBLIC_TWITTER_ENABLED` - Enable Twitter integration

## Template Variables

Some configuration values support template variables that get replaced dynamically:

- `{appName}` - Replaced with `NEXT_PUBLIC_APP_NAME` value

Example:

```bash
NEXT_PUBLIC_WELCOME_TITLE="Welcome to {appName}"
# Results in: "Welcome to AUBRAI"
```

## Examples

### Customizing for Different Brands

```bash
# For Bio DAO
NEXT_PUBLIC_APP_NAME="BioDAO"
NEXT_PUBLIC_PRIMARY_COLOR="#4F46E5"
NEXT_PUBLIC_HERO_TITLE="Decentralized\nBio Research"
NEXT_PUBLIC_APP_DESCRIPTION="Decentralized platform for biological research"
NEXT_PUBLIC_LOGIN_HERO_TITLE="Your decentralized research companion"
NEXT_PUBLIC_LOGIN_HERO_SUBTITLE="Powered by collective intelligence and blockchain technology"
NEXT_PUBLIC_LOGIN_WELCOME_TITLE="Welcome to {appName}"
NEXT_PUBLIC_LOGIN_WELCOME_DESCRIPTION="Join the decentralized autonomous organization revolutionizing biological research through community collaboration."
NEXT_PUBLIC_WELCOME_SUBTITLE="Your decentralized research network"
NEXT_PUBLIC_SUGGESTED_PROMPTS="What are the latest DAO governance proposals?,How can I contribute to bio research?,Find open research funding opportunities,Connect me with bio researchers"

# For Generic Research Platform
NEXT_PUBLIC_APP_NAME="ResearchHub"
NEXT_PUBLIC_PRIMARY_COLOR="#059669"
NEXT_PUBLIC_HERO_TITLE="Collaborative\nResearch Platform"
NEXT_PUBLIC_APP_DESCRIPTION="Where researchers collaborate and innovate"
NEXT_PUBLIC_LOGIN_HERO_TITLE="Your research collaboration platform"
NEXT_PUBLIC_LOGIN_HERO_SUBTITLE="Connect, collaborate, and accelerate scientific discovery"
NEXT_PUBLIC_LOGIN_WELCOME_TITLE="Welcome to {appName}"
NEXT_PUBLIC_LOGIN_WELCOME_DESCRIPTION="Join researchers worldwide in advancing human knowledge through collaborative science."
NEXT_PUBLIC_WELCOME_SUBTITLE="Collaborate with researchers worldwide"
NEXT_PUBLIC_SUGGESTED_PROMPTS="Find research collaborators in my field,What are trending research topics?,Help me write a grant proposal,Review my research methodology"

# Custom chat preview slides
NEXT_PUBLIC_CHAT_PREVIEW_SLIDES="What is blockchain in healthcare?|Blockchain technology can provide secure, decentralized storage for medical records and enable new models for research data sharing.;How does DAO governance work?|DAOs use smart contracts and token-based voting to enable decentralized decision making by community members.;What are the benefits of DeSci?|Decentralized Science democratizes research funding, accelerates peer review, and creates more open access to scientific knowledge."
```

## 🎨 **Chat Preview Slides Format**

The `NEXT_PUBLIC_CHAT_PREVIEW_SLIDES` variable uses a special format to define the chat conversations shown in the login preview:

**Format:** `"Question1|Answer1;Question2|Answer2;Question3|Answer3"`

- **`;`** separates different slides
- **`|`** separates the user question from the AI response
- Each slide creates a conversation pair in the preview

**Example:**

```bash
NEXT_PUBLIC_CHAT_PREVIEW_SLIDES="What is longevity research?|Longevity research focuses on understanding aging mechanisms to extend healthy human lifespan through interventions like cellular reprogramming.;How do senolytic drugs work?|Senolytic drugs selectively eliminate senescent cells that accumulate with age and contribute to inflammation and tissue dysfunction."
```

This creates 2 slides:

1. User asks about longevity research → AI responds about aging mechanisms
2. User asks about senolytic drugs → AI responds about eliminating senescent cells

### Feature Flag Usage

```tsx
import { useFeatureFlag } from '@/hooks/use-ui-config';

function ChatInterface() {
  const speechEnabled = useFeatureFlag('speechToTextEnabled');
  const fileUploadEnabled = useFeatureFlag('fileUploadEnabled');

  return (
    <div>
      {speechEnabled && <SpeechToTextButton />}
      {fileUploadEnabled && <FileUploadButton />}
    </div>
  );
}
```

### Error Messages

```tsx
import { useUIConfigSection } from '@/hooks/use-ui-config';

function ErrorHandler({ error }) {
  const errors = useUIConfigSection('errors');

  const getErrorMessage = (errorType: string) => {
    switch (errorType) {
      case 'connection':
        return errors.connectionError;
      case 'auth':
        return errors.authError;
      case 'validation':
        return errors.validationError;
      default:
        return errors.genericError;
    }
  };

  return <div>{getErrorMessage(error.type)}</div>;
}
```

## Best Practices

1. **Use specific hooks**: Prefer `useUIConfigSection('auth')` over `useUIConfig().auth`
2. **Organize by context**: Group related environment variables together
3. **Provide meaningful defaults**: Always include fallback values
4. **Use template variables**: Leverage `{appName}` for consistency
5. **Feature flags for optional UI**: Use feature flags for optional components
6. **Type safety**: Leverage TypeScript interfaces for better development experience

## Adding New Configuration

To add new configuration options:

1. **Update the interface** in `src/config/ui-config.ts`:

```tsx
export interface UIConfig {
  // ... existing sections
  myNewSection: {
    newText: string;
    newFeature: boolean;
  };
}
```

2. **Add environment variable support**:

```tsx
const DEFAULT_CONFIG: UIConfig = {
  // ... existing config
  myNewSection: {
    newText: process.env.NEXT_PUBLIC_MY_NEW_TEXT || 'Default text',
    newFeature: process.env.NEXT_PUBLIC_MY_NEW_FEATURE === 'true',
  },
};
```

3. **Export for convenience**:

```tsx
export const { myNewSection } = uiConfig;
```

4. **Document in the env example file** (`src/config/ui-config.env.example`)

5. **Use in components**:

```tsx
const myConfig = useUIConfigSection('myNewSection');
```

## Troubleshooting

### Environment Variables Not Loading

- Ensure variables start with `NEXT_PUBLIC_`
- Restart the development server after adding new variables
- Check that `.env.local` is in the project root

### TypeScript Errors

- Make sure the interface is updated when adding new configuration
- Verify the section name matches exactly in `useUIConfigSection()`

### Template Variables Not Working

- Ensure template processing is added in `processConfigTemplates()` function
- Use exact variable names like `{appName}` (case-sensitive)

This system provides maximum flexibility while maintaining type safety and ease of use across the entire application.
