from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import uuid
import os
from datetime import datetime
from typing import Dict, List, Optional
import sys
import logging

# Configure logging immediately
logging.basicConfig(
    level=logging.DEBUG,
    format='[%(levelname)s] %(message)s',
    stream=sys.stderr,
    force=True
)
logger = logging.getLogger(__name__)

# Get the directory of the current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

logger.info(f"BASE_DIR: {BASE_DIR}")
logger.info(f"Files in BASE_DIR: {os.listdir(BASE_DIR)}")

app = Flask(__name__)
logger.info("Flask app created")

CORS(app)
logger.info("CORS enabled")

# ==================== IN-MEMORY DATABASE ====================
# In production, use a proper database like PostgreSQL, MongoDB, etc.
rooms: Dict[str, dict] = {}
connections: Dict[str, List[str]] = {}  # room_code -> list of player names


# ==================== PAGE ROUTES ====================

@app.route('/')
def index():
    """Serve index.html"""
    try:
        logger.debug(f"Attempting to serve index.html from {BASE_DIR}")
        result = send_from_directory(BASE_DIR, 'index.html')
        logger.debug("Successfully served index.html")
        return result
    except Exception as e:
        logger.error(f"ERROR serving /: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/host')
def host_page():
    """Serve host.html"""
    try:
        logger.debug(f"Attempting to serve host.html from {BASE_DIR}")
        result = send_from_directory(BASE_DIR, 'host.html')
        logger.debug("Successfully served host.html")
        return result
    except Exception as e:
        logger.error(f"ERROR serving /host: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/peserta')
def peserta_page():
    """Serve peserta.html"""
    try:
        logger.debug(f"Attempting to serve peserta.html from {BASE_DIR}")
        result = send_from_directory(BASE_DIR, 'peserta.html')
        logger.debug("Successfully served peserta.html")
        return result
    except Exception as e:
        logger.error(f"ERROR serving /peserta: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/styles.css')
def serve_css():
    """Serve styles.css"""
    try:
        logger.debug(f"Attempting to serve styles.css from {BASE_DIR}")
        result = send_from_directory(BASE_DIR, 'styles.css', mimetype='text/css')
        logger.debug("Successfully served styles.css")
        return result
    except Exception as e:
        logger.error(f"ERROR serving /styles.css: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/script.js')
def serve_js():
    """Serve script.js"""
    try:
        logger.debug(f"Attempting to serve script.js from {BASE_DIR}")
        result = send_from_directory(BASE_DIR, 'script.js', mimetype='application/javascript')
        logger.debug("Successfully served script.js")
        return result
    except Exception as e:
        logger.error(f"ERROR serving /script.js: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ==================== WORKER INITIALIZATION ====================

import threading
_worker_ready = threading.Event()

def log_worker_ready():
    """Log that worker is ready to handle requests"""
    logger.info("Worker initialized and ready to handle requests")
    _worker_ready.set()

# Call on first request
_first_request = [True]

@app.before_request
def check_first_request():
    """Log first request to verify worker responsiveness"""
    if _first_request[0]:
        logger.info("FIRST REQUEST RECEIVED - Worker is responsive!")
        _first_request[0] = False
    logger.info(f"Incoming {request.method} {request.path} from {request.remote_addr}")


# ==================== UTILITY FUNCTIONS ====================
def generate_room_code():
    """Generate a random 6-character room code"""
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))


def create_room_object(code: str, name: str) -> dict:
    """Create a room object"""
    return {
        'code': code,
        'name': name,
        'created_at': datetime.now().isoformat(),
        'participants': [],
        'status': 'waiting',  # waiting, playing, finished
        'host_id': str(uuid.uuid4()),
        'questions': [],  # List of questions
        'current_question_id': None,  # Current question being played
        'player_scores': {},  # {player_name: score}
        'question_count': 0  # Counter for question IDs
    }


# ==================== ROOM MANAGEMENT ENDPOINTS ====================

@app.route('/api/rooms', methods=['POST'])
def create_room():
    """
    Create a new game room
    
    Request body:
    {
        "name": "Room Name"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "code": "ABC123",
            "name": "Room Name",
            "created_at": "2026-02-06T...",
            "participants": [],
            "status": "waiting"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({
                'success': False,
                'message': 'Room name is required'
            }), 400
        
        room_name = data['name'].strip()
        if not room_name:
            return jsonify({
                'success': False,
                'message': 'Room name cannot be empty'
            }), 400
        
        if len(room_name) > 50:
            return jsonify({
                'success': False,
                'message': 'Room name cannot exceed 50 characters'
            }), 400
        
        # Generate unique room code
        room_code = generate_room_code()
        while room_code in rooms:
            room_code = generate_room_code()
        
        # Create room
        room = create_room_object(room_code, room_name)
        rooms[room_code] = room
        connections[room_code] = []
        
        return jsonify({
            'success': True,
            'message': 'Room created successfully',
            'data': room
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error creating room: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>', methods=['GET'])
def get_room(room_code: str):
    """
    Get room information
    
    Response:
    {
        "success": true,
        "data": {
            "code": "ABC123",
            "name": "Room Name",
            "created_at": "2026-02-06T...",
            "participants": ["Player1", "Player2"],
            "status": "waiting"
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        return jsonify({
            'success': True,
            'data': room
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting room: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>', methods=['DELETE'])
def delete_room(room_code: str):
    """
    Delete a room
    
    Response:
    {
        "success": true,
        "message": "Room deleted successfully"
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        del rooms[room_code]
        if room_code in connections:
            del connections[room_code]
        
        return jsonify({
            'success': True,
            'message': 'Room deleted successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error deleting room: {str(e)}'
        }), 500


# ==================== PARTICIPANT MANAGEMENT ENDPOINTS ====================

@app.route('/api/rooms/<room_code>/join', methods=['POST'])
def join_room(room_code: str):
    """
    Join a room with player name
    
    Request body:
    {
        "player_name": "Player Name"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "code": "ABC123",
            "name": "Room Name",
            "participants": ["Player Name"],
            "status": "waiting"
        }
    }
    """
    try:
        room_code = room_code.upper()
        data = request.get_json()
        
        if not data or 'player_name' not in data:
            return jsonify({
                'success': False,
                'message': 'Player name is required'
            }), 400
        
        player_name = data['player_name'].strip()
        if not player_name:
            return jsonify({
                'success': False,
                'message': 'Player name cannot be empty'
            }), 400
        
        if len(player_name) > 30:
            return jsonify({
                'success': False,
                'message': 'Player name cannot exceed 30 characters'
            }), 400
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        # Check if player already exists
        if player_name in room['participants']:
            return jsonify({
                'success': False,
                'message': 'Player name already exists in this room'
            }), 400
        
        # Add player to room
        room['participants'].append(player_name)
        
        return jsonify({
            'success': True,
            'message': 'Successfully joined room',
            'data': room
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error joining room: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/leave', methods=['POST'])
def leave_room(room_code: str):
    """
    Leave a room
    
    Request body:
    {
        "player_name": "Player Name"
    }
    
    Response:
    {
        "success": true,
        "message": "Successfully left room"
    }
    """
    try:
        room_code = room_code.upper()
        data = request.get_json()
        
        if not data or 'player_name' not in data:
            return jsonify({
                'success': False,
                'message': 'Player name is required'
            }), 400
        
        player_name = data['player_name'].strip()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        if player_name not in room['participants']:
            return jsonify({
                'success': False,
                'message': 'Player not found in this room'
            }), 404
        
        # Remove player from room
        room['participants'].remove(player_name)
        
        return jsonify({
            'success': True,
            'message': 'Successfully left room'
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error leaving room: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/participants', methods=['GET'])
def get_participants(room_code: str):
    """
    Get list of participants in a room
    
    Response:
    {
        "success": true,
        "data": {
            "participants": ["Player1", "Player2"],
            "count": 2
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        participants = room['participants']
        
        return jsonify({
            'success': True,
            'data': {
                'participants': participants,
                'count': len(participants)
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting participants: {str(e)}'
        }), 500


# ==================== ROOM STATUS ENDPOINTS ====================

@app.route('/api/rooms/<room_code>/status', methods=['GET'])
def get_room_status(room_code: str):
    """
    Get room status
    
    Response:
    {
        "success": true,
        "data": {
            "code": "ABC123",
            "status": "waiting",
            "participants_count": 2
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        return jsonify({
            'success': True,
            'data': {
                'code': room['code'],
                'name': room['name'],
                'status': room['status'],
                'participants_count': len(room['participants'])
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting room status: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/start', methods=['POST'])
def start_game(room_code: str):
    """
    Start a game in the room
    
    Response:
    {
        "success": true,
        "message": "Game started",
        "data": {
            "status": "playing"
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        if len(room['participants']) == 0:
            return jsonify({
                'success': False,
                'message': 'At least one participant is required to start the game'
            }), 400
        
        room['status'] = 'playing'
        
        return jsonify({
            'success': True,
            'message': 'Game started',
            'data': {'status': room['status']}
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error starting game: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/finish', methods=['POST'])
def finish_game(room_code: str):
    """
    Finish a game in the room
    
    Response:
    {
        "success": true,
        "message": "Game finished",
        "data": {
            "status": "finished"
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        room['status'] = 'finished'
        
        return jsonify({
            'success': True,
            'message': 'Game finished',
            'data': {'status': room['status']}
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error finishing game: {str(e)}'
        }), 500


# ==================== STATISTICS & INFO ENDPOINTS ====================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Get server statistics
    
    Response:
    {
        "success": true,
        "data": {
            "total_rooms": 5,
            "active_rooms": 3,
            "total_participants": 12
        }
    }
    """
    try:
        total_rooms = len(rooms)
        active_rooms = sum(1 for room in rooms.values() if room['status'] != 'finished')
        total_participants = sum(len(room['participants']) for room in rooms.values())
        
        return jsonify({
            'success': True,
            'data': {
                'total_rooms': total_rooms,
                'active_rooms': active_rooms,
                'total_participants': total_participants
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting statistics: {str(e)}'
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    
    Response:
    {
        "status": "ok"
    }
    """
    logger.info("Health check called")
    return jsonify({'status': 'ok'}), 200


# ==================== GAME LOGIC ENDPOINTS ====================

@app.route('/api/rooms/<room_code>/questions', methods=['POST'])
def create_question(room_code: str):
    """
    Create a new TTS question
    
    Request body:
    {
        "question": "Ibu Kota Indonesia",
        "answer": "JAKARTA",
        "helping_letters": [
            {"position": 0, "letter": "J"},
            {"position": 5, "letter": "A"}
        ]
    }
    
    Response:
    {
        "success": true,
        "data": {
            "question_id": "q1",
            "question": "Ibu Kota Indonesia",
            "answer": "JAKARTA",
            "answer_length": 7,
            "helping_letters": [...],
            "status": "active"
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        data = request.get_json()
        
        if not data or 'question' not in data or 'answer' not in data:
            return jsonify({
                'success': False,
                'message': 'Question and answer are required'
            }), 400
        
        question_text = data['question'].strip()
        answer = data['answer'].strip().upper()
        helping_letters = data.get('helping_letters', [])
        
        if not question_text or not answer:
            return jsonify({
                'success': False,
                'message': 'Question and answer cannot be empty'
            }), 400
        
        # Create question object
        room = rooms[room_code]
        question_id = f"q{room['question_count'] + 1}"
        room['question_count'] += 1
        
        question_obj = {
            'question_id': question_id,
            'question': question_text,
            'answer': answer,
            'answer_length': len(answer),
            'helping_letters': helping_letters,  # [{"position": 0, "letter": "A"}, ...]
            'status': 'active',  # active, revealed
            'revealed_at': None,
            'created_at': datetime.now().isoformat()
        }
        
        room['questions'].append(question_obj)
        
        # If no current question, set this as current
        if room['current_question_id'] is None:
            room['current_question_id'] = question_id
        
        return jsonify({
            'success': True,
            'message': 'Question created successfully',
            'data': question_obj
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error creating question: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/questions/current', methods=['GET'])
def get_current_question(room_code: str):
    """
    Get current question
    
    Response:
    {
        "success": true,
        "data": {
            "question_id": "q1",
            "question": "Ibu Kota Indonesia",
            "answer_length": 7,
            "helping_letters": [...],
            "status": "active"
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        if not room['current_question_id']:
            return jsonify({
                'success': False,
                'message': 'No active question'
            }), 404
        
        # Find current question
        current_q = None
        for q in room['questions']:
            if q['question_id'] == room['current_question_id']:
                current_q = q
                break
        
        if not current_q:
            return jsonify({
                'success': False,
                'message': 'Current question not found'
            }), 404
        
        # Return question without full answer for participants
        return jsonify({
            'success': True,
            'data': {
                'question_id': current_q['question_id'],
                'question': current_q['question'],
                'answer_length': current_q['answer_length'],
                'helping_letters': current_q['helping_letters'],
                'status': current_q['status'],
                'answer': current_q['answer'] if current_q['status'] == 'revealed' else None
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting current question: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/current-question/<question_id>', methods=['PUT'])
def set_current_question(room_code: str, question_id: str):
    """
    Set the current question for a room
    
    Response:
    {
        "success": true,
        "message": "Current question updated",
        "data": {
            "current_question_id": "q1"
        }
    }
    """
    try:
        room_code = room_code.upper()
        question_id = question_id.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        # Check if question exists
        question_exists = any(q['question_id'] == question_id for q in room['questions'])
        if not question_exists:
            return jsonify({
                'success': False,
                'message': 'Question not found'
            }), 404
        
        # Set current question
        room['current_question_id'] = question_id
        
        return jsonify({
            'success': True,
            'message': 'Current question updated',
            'data': {
                'current_question_id': room['current_question_id']
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error setting current question: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/current-question', methods=['DELETE'])
def clear_current_question(room_code: str):
    """
    Clear the current question (for next round)
    
    Response:
    {
        "success": true,
        "message": "Current question cleared"
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        room['current_question_id'] = None
        
        return jsonify({
            'success': True,
            'message': 'Current question cleared'
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error clearing current question: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/questions/<question_id>', methods=['DELETE'])
def delete_question_api(room_code: str, question_id: str):
    """
    Delete a question
    
    Response:
    {
        "success": true,
        "message": "Question deleted"
    }
    """
    try:
        room_code = room_code.upper()
        question_id = question_id.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        # Find and remove question
        room['questions'] = [q for q in room['questions'] if q['question_id'] != question_id]
        
        # If deleted question was current, clear it
        if room['current_question_id'] == question_id:
            room['current_question_id'] = None
        
        return jsonify({
            'success': True,
            'message': 'Question deleted'
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error deleting question: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/questions/<question_id>/reveal', methods=['PUT'])
def reveal_question(room_code: str, question_id: str):
    """
    Reveal the answer for a question
    
    Response:
    {
        "success": true,
        "data": {
            "question_id": "q1",
            "answer": "JAKARTA"
        }
    }
    """
    try:
        room_code = room_code.upper()
        question_id = question_id.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        # Find question
        question = None
        for q in room['questions']:
            if q['question_id'] == question_id:
                question = q
                break
        
        if not question:
            return jsonify({
                'success': False,
                'message': 'Question not found'
            }), 404
        
        # Reveal answer
        question['status'] = 'revealed'
        question['revealed_at'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'message': 'Answer revealed',
            'data': {
                'question_id': question['question_id'],
                'answer': question['answer']
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error revealing answer: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/questions/next', methods=['POST'])
def next_question(room_code: str):
    """
    Move to the next question
    
    Response:
    {
        "success": true,
        "message": "Moved to next question",
        "data": {
            "current_question_id": "q2"
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        # Find current question index
        current_idx = -1
        for i, q in enumerate(room['questions']):
            if q['question_id'] == room['current_question_id']:
                current_idx = i
                break
        
        # Move to next question if available
        if current_idx < len(room['questions']) - 1:
            room['current_question_id'] = room['questions'][current_idx + 1]['question_id']
            return jsonify({
                'success': True,
                'message': 'Moved to next question',
                'data': {
                    'current_question_id': room['current_question_id']
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No more questions available'
            }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error moving to next question: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/answer', methods=['POST'])
def submit_answer(room_code: str):
    """
    Submit an answer attempt
    
    Request body:
    {
        "player_name": "Player 1",
        "answer": "JAKARTA"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "is_correct": true,
            "correct_answer": "JAKARTA"
        }
    }
    """
    try:
        room_code = room_code.upper()
        data = request.get_json()
        
        if not data or 'player_name' not in data or 'answer' not in data:
            return jsonify({
                'success': False,
                'message': 'Player name and answer are required'
            }), 400
        
        player_name = data['player_name'].strip()
        answer = data['answer'].strip().upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        if not room['current_question_id']:
            return jsonify({
                'success': False,
                'message': 'No active question'
            }), 400
        
        # Find current question
        current_q = None
        for q in room['questions']:
            if q['question_id'] == room['current_question_id']:
                current_q = q
                break
        
        if not current_q:
            return jsonify({
                'success': False,
                'message': 'Current question not found'
            }), 404
        
        # Check answer
        is_correct = (answer == current_q['answer'])
        
        return jsonify({
            'success': True,
            'data': {
                'is_correct': is_correct,
                'correct_answer': current_q['answer'] if is_correct else None
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error submitting answer: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/points', methods=['POST'])
def award_points(room_code: str):
    """
    Award points to a player
    
    Request body:
    {
        "player_name": "Player 1",
        "points": 100
    }
    
    Response:
    {
        "success": true,
        "data": {
            "player_name": "Player 1",
            "points": 100,
            "total_score": 100
        }
    }
    """
    try:
        room_code = room_code.upper()
        data = request.get_json()
        
        if not data or 'player_name' not in data or 'points' not in data:
            return jsonify({
                'success': False,
                'message': 'Player name and points are required'
            }), 400
        
        player_name = data['player_name'].strip()
        points = int(data['points'])
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        # Initialize score if not exists
        if player_name not in room['player_scores']:
            room['player_scores'][player_name] = 0
        
        # Add points
        room['player_scores'][player_name] += points
        
        return jsonify({
            'success': True,
            'message': 'Points awarded',
            'data': {
                'player_name': player_name,
                'points_awarded': points,
                'total_score': room['player_scores'][player_name]
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error awarding points: {str(e)}'
        }), 500


@app.route('/api/rooms/<room_code>/scores', methods=['GET'])
def get_scores(room_code: str):
    """
    Get all player scores
    
    Response:
    {
        "success": true,
        "data": {
            "scores": [
                {"player_name": "Player 1", "score": 100},
                {"player_name": "Player 2", "score": 50}
            ]
        }
    }
    """
    try:
        room_code = room_code.upper()
        
        if room_code not in rooms:
            return jsonify({
                'success': False,
                'message': 'Room not found'
            }), 404
        
        room = rooms[room_code]
        
        # Format scores
        scores = [
            {'player_name': name, 'score': score}
            for name, score in sorted(room['player_scores'].items(), key=lambda x: x[1], reverse=True)
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'scores': scores
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting scores: {str(e)}'
        }), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        'success': False,
        'message': 'Method not allowed'
    }), 405


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500


# ==================== GLOBAL ERROR HANDLER ====================

@app.errorhandler(Exception)
def handle_exception(e):
    """Catch ALL exceptions and log them before returning 500"""
    logger.error(f"Unhandled exception in Flask app: {type(e).__name__}: {str(e)}", exc_info=True)
    return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


# ==================== MAIN ====================

# Production: run with Gunicorn. Example start command in Railway:
#   gunicorn app:app --bind 0.0.0.0:$PORT --workers 2
# For local development you can call `run_local()`.

def run_local():
    """Run development server locally. Not used in production."""
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)


# ==================== MODULE INITIALIZATION VERIFICATION ====================

logger.info("app.py module loaded successfully")
logger.info(f"Flask app object: {app}")
logger.info(f"App routes registered: {[str(rule) for rule in app.url_map.iter_rules()]}")
