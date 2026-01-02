🏥🔐 PRANIKOV UPHILL  
A Full-Stack Hospital Management & Healthcare Platform

👁️‍🗨️ Overview  
PRANIKOV UPHILL is a modern healthcare management system that:

- Digitizes hospital operations for patients, doctors, and administrators  
- Enables appointment booking, consultations, pharmacy, and payments  
- Provides secure role-based access using JWT authentication  
- Supports event-driven architecture and real-time notifications  
- Built with Spring Boot (Backend) and React (Frontend)

🚀 Features  
- Role-based authentication (Patient, Doctor, Admin)  
- Appointment booking & scheduling  
- Doctor–patient portal  
- Prescription & health record management  
- Video consultations  
- Online pharmacy with cart & order tracking  
- Payment integration (UPI, Stripe, Razorpay with QR codes)  
- SMS & OTP notifications using Twilio  
- Admin dashboard with analytics  
- Event-driven architecture using Kafka  
- AI assistants for operational tasks  

📂 Project Structure  

PRANIKOV-UPHILL/  
├── BACKEND/                         # Spring Boot REST API  
│   ├── src/main/java               # Java source code  
│   ├── src/main/resources          # application.yml, configs  
│   ├── pom.xml                     # Maven configuration  
│   └── docker-compose.yml          # Kafka & services setup  
│  
├── FRONTEND/                       # React SPA  
│   ├── src/                        # React components & pages  
│   ├── public/                     # Static assets  
│   ├── package.json                # Dependencies  
│   └── vite.config.ts              # Vite configuration  
│  
└── README.md                       # Project documentation  

🔁 System Workflow  

1. User accesses the React frontend.  
2. Frontend communicates with Spring Boot backend via REST APIs.  
3. Backend authenticates users using JWT and role-based access.  
4. Kafka handles asynchronous events (notifications, orders, logs).  
5. PostgreSQL stores user data, appointments, prescriptions, and orders.  
6. Twilio sends OTPs and SMS alerts.  
7. Payment gateways process transactions and generate QR codes.  
8. Admin dashboard displays analytics and system metrics.  

🛠️ Tech Stack  

Layer | Technology  
----- | ----------  
Frontend | React (TypeScript), Vite, Tailwind CSS, shadcn/ui  
Backend | Java 17+, Spring Boot, Spring Security  
Database | PostgreSQL  
Authentication | JWT  
Messaging | Apache Kafka  
Payments | UPI, Stripe, Razorpay, QR Codes  
Notifications | Twilio (SMS & OTP)  
API Communication | REST (Axios)  
Build Tools | Maven, npm  
Containerization | Docker, Docker Compose  

🚀 Usage  

1. Clone the repository.  
2. Start Kafka and services using Docker Compose.  
3. Run the Spring Boot backend server.  
4. Start the React frontend development server.  
5. Access the application in the browser.  
6. Log in as Patient, Doctor, or Admin to use role-specific features.  

📜 License  

MIT License. See LICENSE file for details.
