import React, {useState, useEffect} from 'react';
import {Text, Box, Newline, useInput} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import fetch from 'node-fetch';
import {promises as fs} from 'fs';
import {join} from 'path';
import {homedir} from 'os';
import {
	ASCII_DUCK,
	getPersonalityById,
	getPersonalityOptions,
} from './prompts.js';
import SyntaxHighlight from 'ink-syntax-highlight';

type Props = {
	apiKey?: string;
	model?: string;
	personality?: string;
	reconfigure?: boolean;
};

interface Message {
	role: 'user' | 'assistant';
	content: string;
}

interface Model {
	id: string;
	name: string;
	context_length: number;
	pricing?: {
		prompt: number;
		completion: number;
	};
}

interface Config {
	apiKey: string;
	model: string;
	personality: string;
}

type SetupStep =
	| 'api-key'
	| 'personality-selection'
	| 'model-selection'
	| 'complete';

const CONFIG_DIR = join(homedir(), '.duckli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// Component to render message content with syntax highlighting
const MessageRenderer: React.FC<{content: string}> = ({content}) => {
	// Parse code blocks from markdown-style content
	const parts = content.split(/(```[\s\S]*?```)/g);

	return (
		<Box flexDirection="column">
			{parts.map((part, index) => {
				if (part.startsWith('```') && part.endsWith('```')) {
					// Extract language and code
					const lines = part.slice(3, -3).split('\n');
					const language = lines[0]?.trim().toLowerCase() || '';
					const code = lines.slice(1).join('\n');

					// Display code in a styled box with syntax highlighting
					return (
						<Box
							key={index}
							flexDirection="column"
							borderStyle="single"
							borderColor="gray"
							padding={1}
							marginY={1}
						>
							<Text color="gray" dimColor>
								{language ? `Language: ${language}` : 'Code'}
							</Text>
							<SyntaxHighlight code={code} language={language || 'text'} />
						</Box>
					);
				} else {
					// Regular text
					return part
						.split('\n')
						.map((line, lineIndex) => (
							<Text key={`${index}-${lineIndex}`}>{line}</Text>
						));
				}
			})}
		</Box>
	);
};

export default function App({
	apiKey: initialApiKey,
	model: initialModel,
	personality: initialPersonality,
	reconfigure = false,
}: Props) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isInputMode, setIsInputMode] = useState(false);

	// Setup flow state
	const [setupStep, setSetupStep] = useState<SetupStep>('api-key');
	const [tempApiKey, setTempApiKey] = useState('');
	const [selectedPersonalityIndex, setSelectedPersonalityIndex] = useState(0);
	const [availableModels, setAvailableModels] = useState<Model[]>([]);
	const [selectedModel, setSelectedModel] = useState('');
	const [finalApiKey, setFinalApiKey] = useState(initialApiKey || '');
	const [finalModel, setFinalModel] = useState(initialModel || '');
	const [finalPersonality, setFinalPersonality] = useState(
		initialPersonality || 'cheerful',
	);
	const [configLoaded, setConfigLoaded] = useState(false);

	// Initialize personality selection with proper sync
	useEffect(() => {
		const personalityOptions = getPersonalityOptions();
		if (personalityOptions.length > 0 && personalityOptions[0]) {
			setSelectedPersonalityIndex(0);
		}
	}, []);

	// Determine if we need setup
	const needsSetup = (!initialApiKey && !finalApiKey) || reconfigure;

	// Config file operations
	const saveConfig = async (config: Config) => {
		try {
			await fs.mkdir(CONFIG_DIR, {recursive: true});
			await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
		} catch (error) {
			console.error('Failed to save config:', error);
		}
	};

	const loadConfig = async (): Promise<Config | null> => {
		try {
			const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
			return JSON.parse(configData) as Config;
		} catch (error) {
			return null;
		}
	};

	const clearConfig = async () => {
		try {
			await fs.unlink(CONFIG_FILE);
		} catch (error) {
			// File might not exist, that's ok
		}
	};

	// Load saved config on startup
	useEffect(() => {
		const loadSavedConfig = async () => {
			if (initialApiKey) {
				// Command line args take precedence
				setConfigLoaded(true);
				return;
			}

			if (reconfigure) {
				// Clear existing config and force setup
				await clearConfig();
				setConfigLoaded(true);
				return;
			}

			const savedConfig = await loadConfig();
			if (savedConfig && savedConfig.apiKey) {
				setFinalApiKey(savedConfig.apiKey);
				setFinalModel(savedConfig.model || 'meta-llama/llama-3.3-8b-instruct:free');
				setFinalPersonality(savedConfig.personality || 'cheerful');
				setSetupStep('complete');
			}
			setConfigLoaded(true);
		};

		loadSavedConfig();
	}, [initialApiKey, reconfigure]);

	useEffect(() => {
		if (
			!needsSetup &&
			configLoaded &&
			finalApiKey &&
			finalModel &&
			finalPersonality
		) {
			// Skip setup only if we have ALL required pieces
			setSetupStep('complete');
			setFinalApiKey(initialApiKey || finalApiKey);
			setFinalModel(initialModel || finalModel);
			setFinalPersonality(initialPersonality || finalPersonality);
		} else if (configLoaded && !needsSetup) {
			// If we have some config but not all pieces, determine what we're missing
			if (!finalApiKey && !initialApiKey) {
				setSetupStep('api-key');
			} else if (!finalModel && !initialModel) {
				setSetupStep('model-selection');
			} else if (!finalPersonality && !initialPersonality) {
				setSetupStep('personality-selection');
			} else {
				setSetupStep('complete');
			}
		}
	}, [
		initialApiKey,
		initialModel,
		initialPersonality,
		needsSetup,
		configLoaded,
		finalApiKey,
		finalModel,
		finalPersonality,
	]);

	useEffect(() => {
		if (setupStep === 'complete' && finalApiKey && configLoaded) {
			// Save config when setup is complete
			if (!initialApiKey) {
				// Only save if not using command line args
				saveConfig({
					apiKey: finalApiKey,
					model: finalModel,
					personality: finalPersonality,
				});
			}

			// Show welcome message using selected personality
			const selectedPersonalityConfig = getPersonalityById(
				finalPersonality || 'cheerful',
			);
			const welcomeMessage: Message = {
				role: 'assistant',
				content: selectedPersonalityConfig.welcomeMessage,
			};

			setMessages([welcomeMessage]);
			setIsInputMode(true);
		}
	}, [
		setupStep,
		finalApiKey,
		finalModel,
		finalPersonality,
		configLoaded,
		initialApiKey,
	]);

	// Input handler - only processes keys during setup steps
	useInput((input, key) => {
		if (key.escape) {
			process.exit(0);
		}
		if (key.ctrl && input === 'c') {
			process.exit(0);
		}

		// Handle personality selection navigation ONLY during personality selection
		if (setupStep === 'personality-selection') {
			const personalityOptions = getPersonalityOptions();
			
			if (key.upArrow) {
				const newIndex = selectedPersonalityIndex > 0 ? selectedPersonalityIndex - 1 : personalityOptions.length - 1;
				setSelectedPersonalityIndex(newIndex);
			} else if (key.downArrow) {
				const newIndex = selectedPersonalityIndex < personalityOptions.length - 1 ? selectedPersonalityIndex + 1 : 0;
				setSelectedPersonalityIndex(newIndex);
			} else if (key.return) {
				const selectedOption = personalityOptions[selectedPersonalityIndex];
				if (selectedOption) {
					setFinalPersonality(selectedOption.value);
					setSetupStep('complete');
				}
			}
		}
	}, {
		isActive: setupStep !== 'complete' // Only active during setup, not during chat
	});

	const fetchAvailableModels = async (apiKey: string) => {
		setIsLoading(true);
		try {
			const response = await fetch('https://openrouter.ai/api/v1/models', {
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch models: ${response.status}`);
			}

			const data = (await response.json()) as any;
			const models: Model[] = (data.data || [])
				.filter(
					(model: any) =>
						!model.id.includes('free') && model.context_length >= 4000,
				)
				.map((model: any) => ({
					id: model.id,
					name: model.name || model.id,
					context_length: model.context_length,
					pricing: model.pricing,
				}))
				.sort((a: Model, b: Model) => {
					// Prioritize popular models
					const popularModels = [
						'anthropic/claude-3.5-sonnet',
						'openai/gpt-4',
						'anthropic/claude-3-haiku',
						'openai/gpt-3.5-turbo',
					];
					const aIndex = popularModels.indexOf(a.id);
					const bIndex = popularModels.indexOf(b.id);

					if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
					if (aIndex !== -1) return -1;
					if (bIndex !== -1) return 1;

					return a.name.localeCompare(b.name);
				})
				.slice(0, 15); // Limit to top 15 models

			setAvailableModels(models);
			// Set default model selection
			setSelectedModel('meta-llama/llama-3.3-8b-instruct:free');
			setSetupStep('model-selection');
		} catch (error) {
			setAvailableModels([]);
			// Fallback to default model on error and skip to personality selection
			setFinalModel('anthropic/claude-3.5-sonnet');
			setSetupStep('personality-selection');
		}
		setIsLoading(false);
	};

	const handleApiKeySubmit = async () => {
		if (!tempApiKey.trim()) return;

		const apiKey = tempApiKey.trim();
		setFinalApiKey(apiKey);
		// Move to model selection instead of personality selection
		fetchAvailableModels(apiKey);
	};

	const handleModelSubmit = () => {
		if (!selectedModel.trim()) return;

		// Check if the entered model exists in available models
		const modelExists = availableModels.some(
			model => model.id === selectedModel.trim(),
		);

		if (modelExists || selectedModel.trim() === 'anthropic/claude-3.5-sonnet') {
			setFinalModel(selectedModel.trim());
			setSetupStep('personality-selection');
		} else {
			// For now, just use the entered model anyway (OpenRouter might have more models)
			setFinalModel(selectedModel.trim());
			setSetupStep('personality-selection');
		}
	};

	const sendMessage = async () => {
		if (!input.trim() || isLoading || !finalApiKey) return;

		const userMessage: Message = {
			role: 'user',
			content: input.trim(),
		};

		setMessages(prev => [...prev, userMessage]);
		setInput('');
		setIsLoading(true);

		try {
			// Get the personality-specific system prompt
			const selectedPersonalityConfig = getPersonalityById(
				finalPersonality || 'cheerful',
			);

			const response = await fetch(
				'https://openrouter.ai/api/v1/chat/completions',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${finalApiKey}`,
						'Content-Type': 'application/json',
						'X-Title': 'DuckLI - AI Rubber Duck',
					},
					body: JSON.stringify({
						model: finalModel,
						messages: [
							{
								role: 'system',
								content: selectedPersonalityConfig.systemPrompt,
							},
							...messages,
							userMessage,
						],
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					`OpenRouter API error: ${response.status} ${response.statusText}`,
				);
			}

			const data = (await response.json()) as any;
			const assistantMessage: Message = {
				role: 'assistant',
				content: data.choices[0].message.content,
			};

			setMessages(prev => [...prev, assistantMessage]);
		} catch (error) {
			const errorMessage: Message = {
				role: 'assistant',
				content: `❌ Sorry, I encountered an error: ${
					error instanceof Error ? error.message : 'Unknown error'
				}. Please check your API key and try again.`,
			};
			setMessages(prev => [...prev, errorMessage]);
		}

		setIsLoading(false);
	};

	// Setup flow: API Key input
	if (setupStep === 'api-key') {
		if (!configLoaded) {
			return (
				<Box flexDirection="column" padding={1}>
					<Box borderStyle="round" borderColor="yellow" padding={1}>
						<Text color="yellow">🦆 DuckLI</Text>
					</Box>
					<Box justifyContent="center">
						<Text color="yellow">{ASCII_DUCK}</Text>
					</Box>
					<Box justifyContent="center">
						<Text color="yellow">
							<Spinner type="dots" /> Loading configuration...
						</Text>
					</Box>
				</Box>
			);
		}

		return (
			<Box flexDirection="column" padding={1}>
				<Box borderStyle="round" borderColor="yellow" padding={1}>
					<Text color="yellow">🦆 Welcome to DuckLI Setup!</Text>
				</Box>
				<Box justifyContent="center">
					<Text color="yellow">{ASCII_DUCK}</Text>
				</Box>
				<Text>Let's get you set up with your AI rubber duck assistant.</Text>
				<Newline />
				<Text>
					First, you'll need an OpenRouter API key to access AI models.
				</Text>
				<Text color="cyan">
					Get your API key at: https://openrouter.ai/keys
				</Text>
				<Newline />
				<Box>
					<Text color="green">API Key: </Text>
					<TextInput
						value={tempApiKey}
						onChange={setTempApiKey}
						onSubmit={handleApiKeySubmit}
						placeholder="sk-or-v1-..."
						mask="*"
					/>
				</Box>
				<Newline />
				<Text color="gray">Press Enter to continue, Esc to exit</Text>
			</Box>
		);
	}

	// Setup flow: Personality selection
	if (setupStep === 'personality-selection') {
		const personalityOptions = getPersonalityOptions();

		return (
			<Box flexDirection="column" padding={1}>
				<Box borderStyle="round" borderColor="yellow" padding={1}>
					<Text color="yellow">🦆 Choose Your Duck's Personality</Text>
				</Box>
				<Box justifyContent="center">
					<Text color="yellow">{ASCII_DUCK}</Text>
				</Box>
				<Text>
					Select the personality you'd like your AI rubber duck assistant to
					have:
				</Text>
				<Newline />
				<Text color="cyan">Available personalities:</Text>
				<Box flexDirection="column" paddingLeft={2}>
					{personalityOptions.map((personality, index) => (
						<Box
							key={personality.value}
							flexDirection="column"
							marginBottom={1}
						>
							<Text color="white">
								<Text color={index === selectedPersonalityIndex ? "cyan" : "magenta"}>
									{index === selectedPersonalityIndex ? "▶ " : "  "}
									{personality.label}
								</Text>
								<Text color="gray"> ({personality.value})</Text>
							</Text>
							<Box paddingLeft={4}>
								<Text color={index === selectedPersonalityIndex ? "white" : "gray"}>
									{personality.description}
								</Text>
							</Box>
						</Box>
					))}
				</Box>
				<Newline />
				<Text color="gray">
					Use ↑/↓ arrow keys to navigate, Enter to select, or Esc to exit
				</Text>
			</Box>
		);
	}

	// Setup flow: Model selection
	if (setupStep === 'model-selection') {
		if (isLoading) {
			return (
				<Box flexDirection="column" padding={1}>
					<Box borderStyle="round" borderColor="yellow" padding={1}>
						<Text color="yellow">🦆 DuckLI Setup</Text>
					</Box>
					<Box justifyContent="center">
						<Text color="yellow">{ASCII_DUCK}</Text>
					</Box>
					<Box justifyContent="center">
						<Text color="yellow">
							<Spinner type="dots" /> Fetching available models...
						</Text>
					</Box>
				</Box>
			);
		}

		return (
			<Box flexDirection="column" padding={1}>
				<Box borderStyle="round" borderColor="yellow" padding={1}>
					<Text color="yellow">🦆 Choose Your AI Model</Text>
				</Box>
				<Box justifyContent="center">
					<Text color="yellow">{ASCII_DUCK}</Text>
				</Box>
				<Text>Enter the AI model you'd like to use as your rubber duck:</Text>
				<Newline />
				<Box>
					<Text color="green">Model: </Text>
					<TextInput
						value={selectedModel}
						onChange={setSelectedModel}
						onSubmit={handleModelSubmit}
						placeholder="meta-llama/llama-3.3-8b-instruct:free"
					/>
				</Box>
				<Newline />
				<Text color="cyan">Popular models:</Text>
				<Box flexDirection="column" paddingLeft={2}>
					{availableModels.slice(0, 8).map(model => (
						<Text key={model.id} color="gray">
							• {model.id}
						</Text>
					))}
				</Box>
				<Newline />
				<Text color="gray">
					Type a model name and press Enter, or Esc to exit
				</Text>
			</Box>
		);
	}

	// Setup complete or normal chat mode
	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="round" borderColor="yellow" padding={1}>
				<Text color="yellow">🦆 DuckLI - Your AI Rubber Duck Assistant</Text>
				{needsSetup && <Text color="gray"> (Using: {finalModel})</Text>}
			</Box>

			<Newline />

			{/* Chat Messages */}
			<Box flexDirection="column" marginBottom={1}>
				{messages.map((message, index) => (
					<Box
						key={index}
						borderStyle="round"
						borderColor={message.role === 'user' ? 'cyan' : 'yellow'}
						padding={1}
						flexDirection="column"
						marginBottom={1}
					>
						<Text color={message.role === 'user' ? 'blue' : 'green'}>
							{message.role === 'user' ? '👤 You:' : '🦆 Duckli:'}
						</Text>
						<Box paddingLeft={2}>
							<MessageRenderer content={message.content} />
						</Box>
					</Box>
				))}
			</Box>

			{/* Loading Spinner */}
			{isLoading && (
				<Box>
					<Text color="yellow">
						<Spinner type="dots" /> Duck is thinking...
					</Text>
				</Box>
			)}

			{/* Input Area */}
			{isInputMode && !isLoading && (
				<Box>
					<Text color="blue">👤 You: </Text>
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={sendMessage}
						placeholder="Describe your coding problem..."
					/>
				</Box>
			)}

			<Newline />
			<Text color="gray">Press Esc or Ctrl+C to exit</Text>
		</Box>
	);
}
