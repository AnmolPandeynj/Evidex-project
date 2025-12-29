# 🕵️‍♂️ Evidex: Temporal Forensics & Chain Builder

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React-61DAFB.svg?logo=react)
![Node](https://img.shields.io/badge/backend-Node.js-339933.svg?logo=node.js)
![MongoDB](https://img.shields.io/badge/database-MongoDB-47A248.svg?logo=mongodb)

**Evidex** is a powerful Temporal Forensics Application designed to build and analyze evidence chains. It features a modern, secure dashboard for managing cases, visualizing evidence timelines, and maintaining chain of custody integrity.

![Evidex Dashboard Preview](https://via.placeholder.com/800x400?text=Dashboard+Preview) *<!-- Replace with actual screenshot -->*

---

## ✨ Features

- **🔐 Secure Authentication**: Protected routes and secure login/signup flows for authorized access.
- **📂 Case Management**: Create, organize, and manage forensic cases efficiently.
- **📊 Interactive Dashboard**: A central hub for monitoring all ongoing investigations.
- **🔗 Chain Building**: Visualize evidence and connections (Chain of Custody).
- **☁️ Cloud & Local Storage**: Hybrid storage capabilities for evidence files using MongoDB and local/cloud file systems.

## 🛠️ Tech Stack

### Client
- **Framework**: React (Vite)
- **Routing**: React Router DOM (v7)
- **Styling**: Tailwind CSS (presumed based on modern stack) & CSS Modules
- **State Management**: Context API

### Server
- **Runtime**: Node.js & Express
- **Database**: MongoDB (Atlas/Local)
- **Storage**: Local filesystem (`/uploads`) & Cloud Integration
- **Security**: CORS, Environment Variables

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB connection string

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/evidex.git
    cd evidex
    ```

2.  **Install dependencies**

    *Client:*
    ```bash
    cd client
    npm install
    ```

    *Server:*
    ```bash
    cd server
    npm install
    ```

3.  **Environment Setup**

    Create a `.env` file in the `server` directory:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    ```

### Running the App

1.  **Start the Server**
    ```bash
    cd server
    npm run dev
    ```

2.  **Start the Client**
    ```bash
    cd client
    npm run dev
    ```

    The client will typically run on `http://localhost:5173`.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements.

## 📄 License

This project is licensed under the MIT License.
