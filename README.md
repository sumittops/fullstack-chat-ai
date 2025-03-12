# assistant-ui-langgraph-fastapi

A demonstration project that combines LangGraph, assistant-stream, and FastAPI to create an AI agent with a modern UI. The project uses [assistant-ui](https://www.assistant-ui.com/) and Next.js.

## Overview

This project showcases:

- A LangGraph agent running on a FastAPI
- Real-time response streaming to the frontend using assistant-stream
- A modern chat UI built with assistant-ui and Next.js
- Demonstrate how to integrate external tools and APIs

## Prerequisites

- Python 3.11
- Node.js v20.18.0
- npm v10.9.2
- Yarn v1.22.22

## Project Structure

```
assistant-ui-langgraph-fastapi/
├── backend/         # FastAPI + assistant-stream + LangGraph server
└── frontend/        # Next.js + assistant-ui client
```

## Setup Instructions

### Set up environment variables

Go to `./backend` and create `.env` file. Follow the example in `.env.example`.

### Backend Setup

The backend is built using the LangChain CLI and utilizes LangGraph's `create_react_agent` for agent creation.

```bash
cd backend
uv pip install -r requirements.txt
python -m app.server
```

#### adding packages

```bash
uv pip install <package>
uv pip freeze > requirements.txt
```

### Frontend Setup

The frontend is generated using the assistant-ui CLI tool.

```bash
cd frontend
pnpm install
pnpm dev
```

## Credits

Based on https://github.com/hminle/langserve-assistant-ui
