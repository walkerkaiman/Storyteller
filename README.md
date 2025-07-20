# Storyteller - Immersive Experience Framework

## Overview

Storyteller is a local-network-based interactive framework designed for creating immersive, participatory experiences. It enables designers to craft narrative journeys that blend digital interactions with physical spaces and human performers.

## Design Philosophy

Storyteller operates on the principle that the most engaging experiences happen when participants feel like they're part of a living story. The framework provides the infrastructure to create experiences where:

- **Participants** become characters in a narrative
- **Physical installations (CHAPTERS)** serve as story locations
- **Mobile performers (CONNECTIONS)** act as living story elements
- **Digital interactions** bridge the physical and virtual worlds

## System Architecture

### Core Components

#### 1. **Backend Server** (`backend/`)
The central nervous system that coordinates all interactions:
- **WebSocket Hub**: Real-time communication between all components
- **REST API**: Data management and retrieval
- **SQLite Database**: Persistent storage of participant journeys
- **Event Logging**: Tracks every interaction for analysis

#### 2. **Participant Interface** (`frontend/`)
The digital companion for participants:
- **Progressive Web App**: Works on any device with a browser
- **QR Code System**: Seamless cross-device continuity
- **Real-time Updates**: Live feedback and story progression
- **Anonymous Participation**: No login required, privacy-focused

#### 3. **CHAPTER Agents** (`agents/chapter-template/`)
Physical installation controllers:
- **Hardware Integration**: Connect to sensors, displays, lighting, etc.
- **Location-Based Triggers**: Respond to participant proximity
- **Environmental Control**: Manage the physical space
- **Story State Management**: Track installation-specific narrative elements

#### 4. **CONNECTION Agents** (`agents/connection-template/`)
Mobile performer tools:
- **Performer Dashboard**: Real-time participant and story information
- **Interaction Logging**: Record performer-participant encounters
- **Story Guidance**: Receive narrative prompts and participant context
- **Mobile Interface**: Works on phones, tablets, or laptops

## Design Workflow

### 1. **Experience Planning**

#### Define Your Story Structure
```
Story Arc:
├── Opening (Welcome/Introduction)
├── Chapter 1 (Physical Installation A)
├── Connection 1 (Performer Interaction)
├── Chapter 2 (Physical Installation B)
├── Connection 2 (Performer Interaction)
└── Conclusion (Wrap-up/Reflection)
```

#### Map Physical Spaces
- **CHAPTER Locations**: Where are your installations?
- **CONNECTION Zones**: Where do performers operate?
- **Flow Paths**: How do participants move between spaces?
- **Technology Infrastructure**: Network coverage, power, etc.

### 2. **Content Creation**

#### For Each CHAPTER:
- **Physical Design**: What does the installation look/feel like?
- **Interaction Triggers**: What sensors or inputs will activate it?
- **Digital Content**: What appears on screens or devices?
- **Environmental Effects**: Lighting, sound, temperature, etc.
- **Story Integration**: How does it advance the narrative?

#### For Each CONNECTION:
- **Performer Role**: What character or guide do they embody?
- **Interaction Style**: How do they engage with participants?
- **Information Access**: What data do they need to see?
- **Story Delivery**: How do they convey narrative elements?

#### For Participants:
- **Entry Point**: How do they discover and join the experience?
- **Digital Companion**: What information/features do they need?
- **Progress Tracking**: How do they know where they are in the story?
- **Personalization**: How does their journey become unique?

### 3. **Technical Implementation**

#### Setting Up the Network
```bash
# 1. Configure your server
cd backend
npm install
npm start

# 2. Deploy participant interface
cd frontend
npm install
npm run build
# Serve the built files on your local network

# 3. Set up CHAPTER agents
cd agents/chapter-template
npm install
# Configure hardware connections and story logic

# 4. Set up CONNECTION agents
cd agents/connection-template
npm install
# Configure performer interfaces and interaction logging
```

#### Hardware Integration Examples

**CHAPTER - Interactive Mirror:**
```javascript
// When participant approaches
socket.emit('chapter_trigger', {
  chapterId: 'mirror-01',
  participantId: participantId,
  trigger: 'proximity',
  data: { distance: 2.5 }
});

// Display personalized content
display.showContent(participantData.storyProgress);
lighting.setMood(participantData.emotionalState);
```

**CONNECTION - Story Guide:**
```javascript
// Receive participant context
socket.on('participant_approaching', (data) => {
  dashboard.showParticipantInfo({
    name: data.participantId,
    storyProgress: data.progress,
    recentInteractions: data.history,
    suggestedTopics: data.storyHooks
  });
});
```

### 4. **Experience Flow**

#### Participant Journey Example:

1. **Discovery**: Participant scans QR code or visits URL
2. **Onboarding**: System generates unique ID, explains experience
3. **CHAPTER Visit**: Approaches physical installation
   - Hardware detects presence
   - Digital interface updates
   - Story content adapts to their progress
4. **CONNECTION Encounter**: Meets performer
   - Performer sees participant's journey
   - Interaction is logged and contextualized
   - Story advances through human connection
5. **Progression**: Digital companion updates with new content
6. **Conclusion**: Experience wraps up with personalized ending

## Design Patterns

### **Adaptive Storytelling**
- Use participant interaction history to personalize content
- Let choices in one CHAPTER affect experiences in others
- Create branching narratives based on participant behavior

### **Environmental Storytelling**
- Use physical space as narrative element
- Coordinate lighting, sound, and digital content
- Create atmosphere that supports the story

### **Human-Digital Integration**
- Design for seamless handoffs between digital and human interactions
- Use digital tools to enhance human connections
- Let performers focus on emotional engagement while tech handles logistics

### **Progressive Disclosure**
- Reveal story elements gradually
- Use participant progress to unlock new content
- Create mystery and discovery through controlled information flow

## Use Cases

### **Museum Experiences**
- **CHAPTERS**: Interactive exhibits with digital overlays
- **CONNECTIONS**: Museum guides with participant context
- **Story**: Historical narrative with personal connections

### **Corporate Events**
- **CHAPTERS**: Brand experience stations
- **CONNECTIONS**: Brand ambassadors with customer insights
- **Story**: Company journey with personalized touchpoints

### **Educational Programs**
- **CHAPTERS**: Learning stations with adaptive content
- **CONNECTIONS**: Teachers with student progress data
- **Story**: Educational narrative with personalized learning paths

### **Art Installations**
- **CHAPTERS**: Interactive art pieces
- **CONNECTIONS**: Artists or facilitators
- **Story**: Artistic narrative with audience participation

## Getting Started

### Quick Start for Designers

1. **Install the Framework**
   ```bash
   git clone [repository]
   cd Storyteller
   npm install
   ```

2. **Configure Your Experience**
   - Edit `backend/config/experience.js` for your story structure
   - Customize `frontend/src/components/` for your visual design
   - Modify agent templates for your hardware/performer needs

3. **Test Your Setup**
   ```bash
   # Start backend
   cd backend && npm start
   
   # Start frontend (in new terminal)
   cd frontend && npm run dev
   
   # Test agent connections
   cd agents/chapter-template && npm start
   ```

4. **Design Your Content**
   - Create your story structure
   - Design physical installations
   - Plan performer interactions
   - Build digital content

### Design Checklist

- [ ] **Story Structure**: Clear narrative arc with chapters and connections
- [ ] **Physical Spaces**: Mapped locations with technology infrastructure
- [ ] **Hardware Integration**: Sensors, displays, and environmental controls
- [ ] **Performer Tools**: Interfaces for human storytellers
- [ ] **Participant Experience**: Seamless digital companion
- [ ] **Content Assets**: Digital media, text, and interactive elements
- [ ] **Testing Plan**: How to validate the experience flow
- [ ] **Deployment Strategy**: Network setup and technical requirements

## Technical Requirements

### **Network Setup**
- Local network with static IP or mDNS/Bonjour
- WebSocket support for real-time communication
- HTTP/HTTPS for web interface

### **Hardware Compatibility**
- **CHAPTERS**: Any device that can run Node.js
- **CONNECTIONS**: Mobile devices (phones, tablets, laptops)
- **Participants**: Any device with a modern web browser

### **Development Tools**
- Node.js 18+ for backend and agents
- Modern web browser for frontend development
- Hardware development tools as needed (Arduino, Raspberry Pi, etc.)

## Support and Community

- **Documentation**: See `docs/SETUP.md` for technical details
- **Examples**: Check `examples/` for sample implementations
- **Issues**: Report bugs and request features via GitHub
- **Contributions**: Welcome design patterns, hardware integrations, and improvements

## License

[Your License Here]

---

**Storyteller** - Where technology meets human connection to create unforgettable experiences.