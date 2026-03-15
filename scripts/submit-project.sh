#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/submit-project.sh <hackathon-slug> <team-name> <track-slug>
# Example: ./scripts/submit-project.sh ai-challenge-2026 team-alpha ai-agent

SLUG="${1:?Usage: submit-project.sh <hackathon-slug> <team-name> <track-slug>}"
TEAM="${2:?Team name required}"
TRACK="${3:?Track slug required}"

HACKATHON_DIR="hackathons/${SLUG}"
if [ ! -f "${HACKATHON_DIR}/hackathon.yml" ]; then
  echo "ERROR: Hackathon not found: ${SLUG}" >&2
  exit 1
fi

DIR="${HACKATHON_DIR}/submissions/${TEAM}"
FILE="${DIR}/project.yml"

if [ -d "$DIR" ]; then
  echo "ERROR: Submission directory already exists: $DIR" >&2
  exit 1
fi

mkdir -p "$DIR"

# Create MDX template files
cat > "${DIR}/README.mdx" << 'MDX'
# Project Name

## Overview

Describe your project here.

## Features

- Feature 1
- Feature 2

## Architecture

Describe your technical architecture.
MDX

cat > "${DIR}/README.zh.mdx" << 'MDX'
# 项目名称

## 概述

在此描述您的项目。

## 功能特点

- 功能 1
- 功能 2

## 技术架构

描述您的技术架构。
MDX

cat > "$FILE" << YAML
synnovator_submission: "2.0"

project:
  name: ""
  name_zh: ""
  tagline: ""
  track: "${TRACK}"

  team:
    - github: ""
      role: "Lead Developer"

  deliverables:
    repo: ""
    video: ""
    demo: ""

  tech_stack: []

  references: []

  description: |
    Project description...
YAML

echo "Created submission: $FILE (with MDX templates)"
echo "Next: edit $FILE and README.mdx, then commit and create PR"
