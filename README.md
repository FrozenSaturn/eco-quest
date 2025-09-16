
# EcoQuest

EcoQuest is a web application that turns environmental actions into a game for students. It allows users to log real-world activities like planting trees and cleaning up waste on a shared, interactive map. This project is a demo built with a React frontend and a Node.js/Express backend.


## Features

- Interactive Map: A primary map view that displays all logged environmental actions.
- Game View: A Pokémon Go-style interface where users can navigate a character and see actions as items in the world.
- Log Actions: Users can add pins for tree planting, cleanups, and school awareness programs. 
- Interactive Items: In the game view, users can click on items to see who logged them and interact with them (e.g., mark a cleanup as complete).

## Tech Stack

**Frontend:** React, Vite, Leaflet.js

**Backend:** Node.js, Express

**Database:** A simple markers.json file is used for data persistence in this demo.

## Installation

Prerequisites: Node.js (v14.0.0 or higher)\
#### Backend setup
```bash
    npm install
    npm start
```
    
The backend will be running at http://localhost:3001.

#### Frontend Setup
```bash
    npm install
    npm run dev
```
The application will be available at http://localhost:3000
