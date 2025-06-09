# 🦆 Duckli - AI-Powered Rubber Duck Assistant

Duckli is an interactive CLI tool that brings the classic "rubber duck debugging" technique into the AI era. It's your friendly AI companion for working through coding problems, debugging issues, and getting programming help.

## What is Rubber Duck Debugging?

Rubber duck debugging is a method where programmers explain their code line-by-line to a rubber duck (or any inanimate object). Often, the act of explaining the problem helps you find the solution yourself. DuckLI takes this concept further by providing an AI that can actually respond with helpful suggestions!

## Features

- 🤖 **AI-Powered**: Uses OpenRouter to access various LLMs (Claude, GPT-4, etc.)
- 💬 **Interactive Chat**: Real-time conversation with your AI rubber duck
- 🎨 **Beautiful CLI**: Clean, colorful interface built with React Ink
- 🔧 **Developer-Focused**: Specifically designed for coding problems and debugging
- 🌐 **Multiple Models**: Support for different AI models via OpenRouter
- ⚡ **Easy Setup**: Interactive first-run setup guides you through configuration

## Installation

### Prerequisites

- Node.js 16 or higher

### Install from Source

```bash
# Clone and build
git clone <repository-url>
cd duckli
npm install
npm run build

# Make it available globally (optional)
npm link
```

## Quick Start

1. **Run DuckLI for the first time:**

   ```bash
   duckli
   ```

2. **Follow the interactive setup:**

   - Enter your OpenRouter API key (get one at [openrouter.ai/keys](https://openrouter.ai/keys))
   - Type your preferred AI model name from the list shown
   - Start chatting with your rubber duck!

3. **Your settings are saved automatically!**
   - Next time you run `duckli`, it will use your saved configuration
   - No need to enter your API key or model again

That's it! DuckLI will guide you through the setup process automatically and remember your preferences.

## Configuration Management

### Automatic Saving

After your first setup, DuckLI automatically saves your API key and model choice to `~/.duckli/config.json`. This means:

- ✅ No need to enter your API key repeatedly
- ✅ Your preferred model is remembered
- ✅ Quick startup on subsequent runs

### Reconfiguring

If you want to change your saved settings:

```bash
duckli --reconfigure
```

This will walk you through the setup process again and update your saved configuration.

### Configuration Priority

DuckLI uses this priority order for configuration:

1. **Command line flags** (highest priority)
2. **Environment variables**
3. **Saved configuration file**
4. **Default values** (lowest priority)

## Setup Options

### Option 1: Interactive Setup (Recommended)

Simply run `duckli` and follow the prompts. This is the easiest way for first-time users.

### Option 2: Environment Variable

```bash
export OPENROUTER_API_KEY=your_api_key_here
duckli
```

### Option 3: Command Line Flags

```bash
# With API key
duckli --api-key your_api_key_here

# With API key and specific model
duckli --api-key your_key --model openai/gpt-4

# Reconfigure saved settings
duckli --reconfigure
```

## Available Models

DuckLI automatically fetches and displays available models from OpenRouter. Popular choices include:

- **anthropic/claude-3.5-sonnet** (default) - Great balance of capability and speed
- **openai/gpt-4** - Excellent reasoning and code understanding
- **anthropic/claude-3-haiku** - Fast and cost-effective
- **openai/gpt-3.5-turbo** - Quick responses for simpler questions

The setup will show you the most popular models first, with full model details.

## Example Conversations

### Debugging Help

```
👤 You: I have a JavaScript function that's supposed to sort an array, but it's not working correctly.

🦆 Duck: I'd love to help you debug that sorting function! Can you share the code with me? Also, let me know:

1. What input are you giving it?
2. What output are you expecting?
3. What output are you actually getting?

This will help me understand what might be going wrong.
```

### Code Review

```
👤 You: Can you review this React component and suggest improvements?

🦆 Duck: Absolutely! I'd be happy to review your React component. Please paste the code and I'll look for:

- Performance optimizations
- Best practices
- Potential bugs
- Code clarity improvements
- Accessibility considerations

Go ahead and share the component!
```

## Usage

### During Setup

- **Enter**: Confirm your input/selection
- **Type model name**: Enter the model ID you want to use
- **Esc**: Exit setup

### During Chat

- **Enter**: Send your message
- **Esc** or **Ctrl+C**: Exit the program

## Advanced Usage

### Bypassing Setup

If you want to skip the interactive setup:

```bash
# Use environment variable
export OPENROUTER_API_KEY=your_key
duckli --model anthropic/claude-3-haiku

# Use command line flags
duckli --api-key your_key --model openai/gpt-4
```

### Changing Configuration

```bash
# Reconfigure everything
duckli --reconfigure

# Temporarily use different model (doesn't save)
duckli --model openai/gpt-4

# Temporarily use different API key (doesn't save)
duckli --api-key different_key
```

### Configuration File Location

Your configuration is saved at:

- **Linux/macOS**: `~/.duckli/config.json`
- **Windows**: `%USERPROFILE%\.duckli\config.json`

You can manually edit this file if needed, or delete it to reset your configuration.

## Getting Your OpenRouter API Key

1. Visit [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create an account if you don't have one
3. Generate a new API key
4. You can set up billing and credits on your OpenRouter dashboard

## Development

### Project Structure

```
duckli/
├── source/
│   ├── app.tsx     # Main React component
│   └── cli.tsx     # CLI entry point
├── dist/           # Compiled JavaScript
├── package.json
└── tsconfig.json
```

### Development Commands

```bash
npm run dev      # Watch mode for development
npm run build    # Compile TypeScript
npm run test     # Run tests and linting
```

## Tips for Better Conversations

1. **Be Specific**: Include error messages, code snippets, and expected vs actual behavior
2. **Provide Context**: Mention what language/framework you're using
3. **Ask Follow-ups**: Don't hesitate to ask for clarification or alternative approaches
4. **Rubber Duck Style**: Try explaining your problem step-by-step - you might solve it yourself!

## Troubleshooting

### API Key Issues

- Make sure your API key is valid and has credits
- Check that the environment variable is properly set
- Verify the key isn't wrapped in quotes when using the flag

### Network Issues

- Ensure you have internet connectivity
- Check if your firewall allows connections to openrouter.ai

### Model Errors

- Some models may have specific requirements or limitations
- Try using the default model if others don't work
- Check OpenRouter's status page for model availability

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

Happy debugging! 🦆✨
