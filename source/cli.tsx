#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ duckli

	Options
	  --api-key       OpenRouter API key (or set OPENROUTER_API_KEY env var)
	  --model         Model to use (default: anthropic/claude-3.5-sonnet)
	  --personality   Duck personality (cheerful, sarcastic, apathetic, deadpan, funny, serious)
	  --reconfigure   Force setup flow even if config exists
	  --help          Show help
	  --version       Show version

	Examples
	  $ export OPENROUTER_API_KEY=your_key_here
	  $ duckli

	  $ duckli --api-key your_key_here

	  $ duckli --api-key your_key --model openai/gpt-4

	  $ duckli --personality sarcastic

	  $ duckli --api-key your_key --model openai/gpt-4 --personality funny

	  $ duckli --reconfigure

	Get your OpenRouter API key at: https://openrouter.ai/keys

	🦆 DuckLI is your AI-powered rubber duck for debugging and coding help!
	
	After first setup, your API key, model, and personality choice will be saved automatically.

	Available personalities:
	  • cheerful  - Upbeat, enthusiastic, and always positive
	  • sarcastic - Witty, sharp-tongued, but ultimately helpful  
	  • apathetic - Indifferent but competent, gets the job done
	  • deadpan   - Dry humor with perfect timing and wit
	  • funny     - Lighthearted, playful, and genuinely entertaining
	  • serious   - Professional, focused, and no-nonsense approach
`,
	{
		importMeta: import.meta,
		flags: {
			apiKey: {
				type: 'string',
			},
			model: {
				type: 'string',
			},
			personality: {
				type: 'string',
			},
			reconfigure: {
				type: 'boolean',
				default: false,
			},
		},
	},
);

// Get API key from flag or environment variable
const apiKey = cli.flags.apiKey || process.env['OPENROUTER_API_KEY'];

// If reconfigure is requested, don't pass the API key to force setup
const finalApiKey = cli.flags.reconfigure ? undefined : apiKey;

render(
	<App
		apiKey={finalApiKey}
		model={cli.flags.model}
		personality={cli.flags.personality}
		reconfigure={cli.flags.reconfigure}
	/>,
);
