#!/bin/bash

# LINE Desktop MCP Server - Claude Desktop Configuration Setup Script
echo "🚀 Setting up LINE Desktop MCP Server configuration..."

# Define paths
CLAUDE_DIR="$HOME/Library/Application Support/Claude"
SOURCE_DIR="$(pwd)"

# Create Claude directory if it doesn't exist
echo "📁 Creating Claude directory..."
mkdir -p "$CLAUDE_DIR"

# Make server executable
echo "🔧 Setting executable permissions..."
chmod +x "$SOURCE_DIR/src/server.js"

# Create or update Claude Desktop config
CONFIG_FILE="$CLAUDE_DIR/claude_desktop_config.json"
echo "⚙️  Updating Claude Desktop configuration..."

# Backup existing config if it exists
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📄 Backed up existing config to $CONFIG_FILE.backup.*"
fi

# Check if config already has mcpServers section
if [ -f "$CONFIG_FILE" ] && grep -q "mcpServers" "$CONFIG_FILE"; then
    echo "⚠️  Existing mcpServers configuration found"
    echo "📝 Please manually add the following to your claude_desktop_config.json:"
    echo ""
    echo "Add this to the \"mcpServers\" section:"
    echo "    \"line-desktop-mcp\": {"
    echo "      \"command\": \"node\","
    echo "      \"args\": ["
    echo "        \"$SOURCE_DIR/src/server.js\""
    echo "      ],"
    echo "      \"env\": {"
    echo "        \"DEBUG\": \"false\""
    echo "      }"
    echo "    }"
else
    # Create new config or add mcpServers section
    if [ -f "$CONFIG_FILE" ]; then
        # Config exists, add mcpServers section
        echo "📝 Adding mcpServers section to existing config..."
        # Use jq if available, otherwise manual approach
        if command -v jq &> /dev/null; then
            jq '. + {"mcpServers": {"line-desktop-mcp": {"command": "node", "args": ["'$SOURCE_DIR'/src/server.js"], "env": {"DEBUG": "false"}}}}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
        else
            echo "⚠️  jq not found. Please manually add mcpServers section."
        fi
    else
        # Create new config
        echo "📝 Creating new claude_desktop_config.json..."
        cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "line-desktop-mcp": {
      "command": "node",
      "args": [
        "$SOURCE_DIR/src/server.js"
      ],
      "env": {
        "DEBUG": "false"
      }
    }
  }
}
EOF
    fi
fi

echo "✅ Configuration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Restart Claude Desktop completely"
echo "2. Ensure LINE Desktop is running and logged in"
echo "3. Grant accessibility permissions to Claude Desktop in System Preferences"
echo "4. Test the MCP tools in a new Claude conversation"
echo ""
echo "📍 MCP Server location: $SOURCE_DIR"
echo "📍 Config file: $CONFIG_FILE"
echo ""
echo "🔧 Manual configuration (if needed):"
echo "Edit: $CONFIG_FILE"
echo "Add the line-desktop-mcp server to the mcpServers section"
