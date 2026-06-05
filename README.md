# AI Creative Studio

A full-stack AI-powered creative platform for generating images, converting raster images to SVG, editing vector graphics, and managing digital assets in one place.

Built with React, FastAPI, Supabase, and Clerk, the platform combines state-of-the-art image generation models with advanced SVG vectorization workflows to provide a complete creative toolkit for designers, developers, and content creators.

## Features

### AI Image Generation

* Generate images from text prompts
* Support for Flux models
* Support for Stable Diffusion models
* Multiple model selection options
* High-quality image generation
* Credit-based generation system

### SVG Conversion

* Convert PNG, JPG, JPEG, and WebP images into SVGs
* Color and monochrome vectorization modes
* Hierarchical SVG generation
* Multiple conversion configurations
* Fast processing pipeline

### SVG Editor

* Built-in SVG editing interface
* Modify generated SVG assets
* Real-time editing workflow
* Export edited SVGs instantly

### Asset Management

* Centralized asset dashboard
* Search generated assets
* Filter and sort images and SVGs
* Pagination and advanced browsing
* Delete and manage assets
* Download original and generated files

### Authentication & User Management

* Secure authentication with Clerk
* User-specific asset storage
* Credit tracking and usage limits
* Protected API endpoints

### Storage & Infrastructure

* Supabase Storage integration
* PostgreSQL database
* FastAPI backend services
* Scalable cloud architecture

## Tech Stack

### Frontend

* React
* TypeScript
* TanStack Router
* TanStack Query
* Zustand
* Tailwind CSS
* Shadcn UI

### Backend

* FastAPI
* Python
* PostgreSQL
* Supabase

### AI Models

* Flux
* Stable Diffusion

### Authentication

* Clerk

### Storage

* Supabase Storage

## Core Workflows

### Text → Image

```text
Prompt
   ↓
Flux / Stable Diffusion
   ↓
Generated Image
   ↓
Asset Library
```

### Image → SVG

```text
Raster Image
   ↓
Vectorization Engine
   ↓
SVG Generation
   ↓
SVG Editor
   ↓
Asset Library
```

### Asset Management

```text
Generate Asset
      ↓
Store in Supabase
      ↓
Search & Filter
      ↓
Edit / Download / Delete
```

## Roadmap

* [ ] Batch image generation
* [ ] Batch SVG conversion
* [ ] AI-assisted SVG cleanup
* [ ] Layer-based SVG editing
* [ ] Collaborative workspaces
* [ ] Asset collections
* [ ] Public sharing links
* [ ] API access for developers
* [ ] Background job processing
* [ ] Custom model support
