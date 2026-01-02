# Flask Backend Code for Healthcare Platform

Save this as `app.py` and run it separately from your React frontend.

## Prerequisites
```bash
pip install flask flask-sqlalchemy flask-cors flask-jwt-extended bcrypt psycopg2-binary
```

## Complete Backend Code (app.py)

```python
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import bcrypt

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://uphill_user:1234@localhost:5432/uphill_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'uphill_secret_key_2024'
app.config['JWT_SECRET_KEY'] = 'uphill_jwt_secret_2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize extensions
db = SQLAlchemy(app)
CORS(app)
jwt = JWTManager(app)

# ================== MODELS ==================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # patient, doctor, admin
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    address = db.Column(db.Text)
    
    # Doctor-specific fields
    specialization = db.Column(db.String(100))
    license = db.Column(db.String(50))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'dateOfBirth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'address': self.address,
            'specialization': self.specialization,
            'license': self.license
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_appointments')
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_appointments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'patientName': self.patient.name,
            'doctorId': self.doctor_id,
            'doctorName': self.doctor.name,
            'date': self.date.isoformat(),
            'time': self.time,
            'status': self.status,
            'reason': self.reason,
            'notes': self.notes
        }

class Prescription(db.Model):
    __tablename__ = 'prescriptions'
    
    id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    medication = db.Column(db.String(200), nullable=False)
    dosage = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.Text)
    date = db.Column(db.Date, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_prescriptions')
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_prescriptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'patientName': self.patient.name,
            'doctorId': self.doctor_id,
            'doctorName': self.doctor.name,
            'medication': self.medication,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'duration': self.duration,
            'date': self.date.isoformat(),
            'notes': self.notes
        }

class HealthRecord(db.Model):
    __tablename__ = 'health_records'
    
    id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    date = db.Column(db.Date, default=datetime.utcnow)
    type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    attachments = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    patient = db.relationship('User', foreign_keys=[patient_id], backref='health_records')
    doctor = db.relationship('User', foreign_keys=[doctor_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patient_id,
            'doctorId': self.doctor_id,
            'doctorName': self.doctor.name if self.doctor else None,
            'date': self.date.isoformat(),
            'type': self.type,
            'description': self.description,
            'attachments': self.attachments
        }

class PharmacyProduct(db.Model):
    __tablename__ = 'pharmacy_products'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    in_stock = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(500))
    prescription_required = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'inStock': self.in_stock,
            'imageUrl': self.image_url,
            'prescriptionRequired': self.prescription_required
        }

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processing, shipped, delivered
    shipping_address = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='orders')
    items = db.relationship('OrderItem', backref='order', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'total': self.total,
            'status': self.status,
            'shippingAddress': self.shipping_address,
            'date': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.String(36), primary_key=True)
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('pharmacy_products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    
    product = db.relationship('PharmacyProduct')
    
    def to_dict(self):
        return {
            'productId': self.product_id,
            'productName': self.product.name,
            'quantity': self.quantity,
            'price': self.price
        }

# ================== HELPER FUNCTIONS ==================

def generate_id():
    import uuid
    return str(uuid.uuid4())

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# ================== AUTH ROUTES ==================

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            id=generate_id(),
            email=data['email'],
            password_hash=hash_password(data['password']),
            name=data['name'],
            role=data.get('role', 'patient'),
            phone=data.get('phone'),
            specialization=data.get('specialization'),
            license=data.get('license')
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password(data['password'], user.password_hash):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ================== APPOINTMENTS ROUTES ==================

@app.route('/api/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role == 'patient':
            appointments = Appointment.query.filter_by(patient_id=user_id).all()
        elif user.role == 'doctor':
            appointments = Appointment.query.filter_by(doctor_id=user_id).all()
        else:  # admin
            appointments = Appointment.query.all()
        
        return jsonify([apt.to_dict() for apt in appointments]), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/appointments/<appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        return jsonify(appointment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        appointment = Appointment(
            id=generate_id(),
            patient_id=user_id if data.get('patientId') is None else data['patientId'],
            doctor_id=data['doctorId'],
            date=datetime.fromisoformat(data['date']).date(),
            time=data['time'],
            reason=data.get('reason', ''),
            status='scheduled'
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify(appointment.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/appointments/<appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        data = request.get_json()
        
        if 'date' in data:
            appointment.date = datetime.fromisoformat(data['date']).date()
        if 'time' in data:
            appointment.time = data['time']
        if 'status' in data:
            appointment.status = data['status']
        if 'reason' in data:
            appointment.reason = data['reason']
        if 'notes' in data:
            appointment.notes = data['notes']
        
        db.session.commit()
        
        return jsonify(appointment.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/appointments/<appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Appointment deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ================== PRESCRIPTIONS ROUTES ==================

@app.route('/api/prescriptions', methods=['GET'])
@jwt_required()
def get_prescriptions():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role == 'patient':
            prescriptions = Prescription.query.filter_by(patient_id=user_id).all()
        elif user.role == 'doctor':
            prescriptions = Prescription.query.filter_by(doctor_id=user_id).all()
        else:  # admin
            prescriptions = Prescription.query.all()
        
        return jsonify([rx.to_dict() for rx in prescriptions]), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/prescriptions', methods=['POST'])
@jwt_required()
def create_prescription():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        prescription = Prescription(
            id=generate_id(),
            patient_id=data['patientId'],
            doctor_id=user_id,
            medication=data['medication'],
            dosage=data['dosage'],
            frequency=data['frequency'],
            duration=data['duration'],
            notes=data.get('notes', '')
        )
        
        db.session.add(prescription)
        db.session.commit()
        
        return jsonify(prescription.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/prescriptions/<prescription_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def manage_prescription(prescription_id):
    try:
        prescription = Prescription.query.get(prescription_id)
        
        if not prescription:
            return jsonify({'message': 'Prescription not found'}), 404
        
        if request.method == 'GET':
            return jsonify(prescription.to_dict()), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            
            if 'medication' in data:
                prescription.medication = data['medication']
            if 'dosage' in data:
                prescription.dosage = data['dosage']
            if 'frequency' in data:
                prescription.frequency = data['frequency']
            if 'duration' in data:
                prescription.duration = data['duration']
            if 'notes' in data:
                prescription.notes = data['notes']
            
            db.session.commit()
            return jsonify(prescription.to_dict()), 200
        
        elif request.method == 'DELETE':
            db.session.delete(prescription)
            db.session.commit()
            return jsonify({'message': 'Prescription deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ================== HEALTH RECORDS ROUTES ==================

@app.route('/api/health-records', methods=['GET'])
@jwt_required()
def get_health_records():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role == 'patient':
            records = HealthRecord.query.filter_by(patient_id=user_id).all()
        else:  # doctor or admin
            records = HealthRecord.query.all()
        
        return jsonify([record.to_dict() for record in records]), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/health-records', methods=['POST'])
@jwt_required()
def create_health_record():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        record = HealthRecord(
            id=generate_id(),
            patient_id=data['patientId'],
            doctor_id=user_id,
            type=data['type'],
            description=data['description'],
            attachments=data.get('attachments', [])
        )
        
        db.session.add(record)
        db.session.commit()
        
        return jsonify(record.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/health-records/<record_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def manage_health_record(record_id):
    try:
        record = HealthRecord.query.get(record_id)
        
        if not record:
            return jsonify({'message': 'Health record not found'}), 404
        
        if request.method == 'GET':
            return jsonify(record.to_dict()), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            
            if 'type' in data:
                record.type = data['type']
            if 'description' in data:
                record.description = data['description']
            if 'attachments' in data:
                record.attachments = data['attachments']
            
            db.session.commit()
            return jsonify(record.to_dict()), 200
        
        elif request.method == 'DELETE':
            db.session.delete(record)
            db.session.commit()
            return jsonify({'message': 'Health record deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ================== PHARMACY ROUTES ==================

@app.route('/api/pharmacy/products', methods=['GET'])
def get_pharmacy_products():
    try:
        products = PharmacyProduct.query.filter_by(in_stock=True).all()
        return jsonify([product.to_dict() for product in products]), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/pharmacy/products/<product_id>', methods=['GET'])
def get_pharmacy_product(product_id):
    try:
        product = PharmacyProduct.query.get(product_id)
        
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        return jsonify(product.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/pharmacy/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        order = Order(
            id=generate_id(),
            user_id=user_id,
            total=data['total'],
            shipping_address=data['shippingAddress'],
            status='pending'
        )
        
        db.session.add(order)
        
        # Create order items
        for item_data in data['items']:
            item = OrderItem(
                id=generate_id(),
                order_id=order.id,
                product_id=item_data['productId'],
                quantity=item_data['quantity'],
                price=item_data['price']
            )
            db.session.add(item)
        
        db.session.commit()
        
        return jsonify(order.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/pharmacy/orders', methods=['GET'])
@jwt_required()
def get_orders():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role == 'admin':
            orders = Order.query.all()
        else:
            orders = Order.query.filter_by(user_id=user_id).all()
        
        return jsonify([order.to_dict() for order in orders]), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ================== DOCTORS ROUTES ==================

@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    try:
        doctors = User.query.filter_by(role='doctor').all()
        return jsonify([doctor.to_dict() for doctor in doctors]), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/doctors/<doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    try:
        doctor = User.query.filter_by(id=doctor_id, role='doctor').first()
        
        if not doctor:
            return jsonify({'message': 'Doctor not found'}), 404
        
        return jsonify(doctor.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ================== ADMIN ROUTES ==================

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        stats = {
            'totalUsers': User.query.count(),
            'totalPatients': User.query.filter_by(role='patient').count(),
            'totalDoctors': User.query.filter_by(role='doctor').count(),
            'totalAppointments': Appointment.query.count(),
            'todayAppointments': Appointment.query.filter_by(date=datetime.utcnow().date()).count(),
            'totalPrescriptions': Prescription.query.count(),
            'totalOrders': Order.query.count()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        users = User.query.all()
        return jsonify([u.to_dict() for u in users]), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        if 'role' in data:
            user.role = data['role']
        
        db.session.commit()
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role != 'admin':
            return jsonify({'message': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ================== SEED DATA (Optional) ==================

def seed_data():
    """Run this once to populate the database with sample data"""
    
    # Create admin user
    admin = User(
        id=generate_id(),
        email='admin@healthcare.com',
        password_hash=hash_password('admin123'),
        name='Admin User',
        role='admin'
    )
    db.session.add(admin)
    
    # Create sample doctors
    doctors_data = [
        {'name': 'Dr. Sarah Johnson', 'email': 'sarah.johnson@healthcare.com', 'specialization': 'Cardiology', 'license': 'MD123456'},
        {'name': 'Dr. Michael Chen', 'email': 'michael.chen@healthcare.com', 'specialization': 'Pediatrics', 'license': 'MD234567'},
        {'name': 'Dr. Emily Brown', 'email': 'emily.brown@healthcare.com', 'specialization': 'Dermatology', 'license': 'MD345678'},
    ]
    
    doctors = []
    for doc_data in doctors_data:
        doctor = User(
            id=generate_id(),
            email=doc_data['email'],
            password_hash=hash_password('doctor123'),
            name=doc_data['name'],
            role='doctor',
            specialization=doc_data['specialization'],
            license=doc_data['license']
        )
        db.session.add(doctor)
        doctors.append(doctor)
    
    # Create sample patient
    patient = User(
        id=generate_id(),
        email='patient@example.com',
        password_hash=hash_password('patient123'),
        name='John Doe',
        role='patient',
        phone='555-0123'
    )
    db.session.add(patient)
    
    # Create sample pharmacy products
    products_data = [
        {'name': 'Aspirin 100mg', 'description': 'Pain reliever and fever reducer', 'price': 9.99, 'category': 'Pain Relief', 'prescription_required': False},
        {'name': 'Amoxicillin 500mg', 'description': 'Antibiotic', 'price': 24.99, 'category': 'Antibiotics', 'prescription_required': True},
        {'name': 'Vitamin D3', 'description': 'Vitamin supplement', 'price': 14.99, 'category': 'Vitamins', 'prescription_required': False},
        {'name': 'Lisinopril 10mg', 'description': 'Blood pressure medication', 'price': 19.99, 'category': 'Cardiovascular', 'prescription_required': True},
    ]
    
    for prod_data in products_data:
        product = PharmacyProduct(
            id=generate_id(),
            name=prod_data['name'],
            description=prod_data['description'],
            price=prod_data['price'],
            category=prod_data['category'],
            in_stock=True,
            prescription_required=prod_data['prescription_required']
        )
        db.session.add(product)
    
    db.session.commit()
    print("Sample data seeded successfully!")

# ================== MAIN ==================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables created!")
        
        # Uncomment the line below to seed sample data (run only once)
        # seed_data()
    
    app.run(debug=True, port=5000)
```

## How to Run

1. **Install PostgreSQL** and create the database:
```sql
CREATE DATABASE uphill_db;
CREATE USER uphill_user WITH PASSWORD '1234';
GRANT ALL PRIVILEGES ON DATABASE uphill_db TO uphill_user;
```

2. **Install Python dependencies**:
```bash
pip install flask flask-sqlalchemy flask-cors flask-jwt-extended bcrypt psycopg2-binary
```

3. **Run the Flask app**:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

4. **First Time Setup**: Uncomment the `seed_data()` line in the main section to create sample data, run the app once, then comment it back out.

## Test Credentials (After Seeding)
- **Admin**: admin@healthcare.com / admin123
- **Doctor**: sarah.johnson@healthcare.com / doctor123
- **Patient**: patient@example.com / patient123

## API Endpoints Summary

### Authentication
- POST `/api/register` - Register new user
- POST `/api/login` - Login user
- GET `/api/profile` - Get current user profile (requires JWT)

### Appointments
- GET `/api/appointments` - Get all appointments
- GET `/api/appointments/<id>` - Get specific appointment
- POST `/api/appointments` - Create appointment
- PUT `/api/appointments/<id>` - Update appointment
- DELETE `/api/appointments/<id>` - Delete appointment

### Prescriptions
- GET `/api/prescriptions` - Get all prescriptions
- POST `/api/prescriptions` - Create prescription
- GET `/api/prescriptions/<id>` - Get specific prescription
- PUT `/api/prescriptions/<id>` - Update prescription
- DELETE `/api/prescriptions/<id>` - Delete prescription

### Health Records
- GET `/api/health-records` - Get all health records
- POST `/api/health-records` - Create health record
- GET `/api/health-records/<id>` - Get specific record
- PUT `/api/health-records/<id>` - Update record
- DELETE `/api/health-records/<id>` - Delete record

### Pharmacy
- GET `/api/pharmacy/products` - Get all products
- GET `/api/pharmacy/products/<id>` - Get specific product
- POST `/api/pharmacy/orders` - Create order
- GET `/api/pharmacy/orders` - Get user orders

### Doctors
- GET `/api/doctors` - Get all doctors
- GET `/api/doctors/<id>` - Get specific doctor

### Admin
- GET `/api/admin/stats` - Get platform statistics
- GET `/api/admin/users` - Get all users
- PUT `/api/admin/users/<id>` - Update user
- DELETE `/api/admin/users/<id>` - Delete user

## Important Notes

1. **CORS**: The backend is configured to allow all origins. In production, update the CORS settings to only allow your frontend domain.

2. **JWT Tokens**: Tokens expire after 30 days. Adjust `JWT_ACCESS_TOKEN_EXPIRES` as needed.

3. **Password Security**: Uses bcrypt for password hashing.

4. **Error Handling**: All endpoints have basic error handling. Enhance as needed.

5. **Database**: Make sure PostgreSQL is running and the database exists before starting the app.

6. **Frontend Connection**: Update the `API_BASE_URL` in your frontend's `src/lib/api.ts` to match your backend URL if different from `http://localhost:5000`.
