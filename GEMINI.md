# Project Context
You are an AI assistant helping with the kittycade project. You are running as an extension inside a codespace on github. You can edit files but you cannot launch a web server with npm or run python or control a browser.

## Key Architecture
- This project is in the style of a classic arcade game like "Snake"
- This project uses html, javascript, and css. No frameworks are used.

## Automated Context
@index.html
@README.md
@constants.js
@input.js
@logic.js
@main.js
@renderer.js
@state.js
@style.css
@test
@audio.js

# Gemini Directives for Kittycade Project

## Core Instructions
Think carefully before making any changes. Only touch the code when the user has asked you to make a change. If unsure, ask.

## **Critical Constraints & Rules**

This section outlines non-negotiable rules for interacting with this project.

### Forbidden Commands & Actions

- **DO NOT** run web servers (e.g., `python -m `http.server``, `npx serve`, etc.).
- **DO NOT** attempt to install new packages or dependencies (e.g., `npm install`).

### Allowed Tools & Workflows

- All changes should be verifiable by reading the code or by running tests if they exist.
- Only use the tools provided.

