import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# --------SETUP DATABASE--------
DATABASE = 'connects.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def init_db():
    with app.app_context():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                comment TEXT,
                timestamp TEXT
            )
        ''')
        conn.commit()
        conn.close()

init_db()

# --------HELPER FUNCTION---------
def time_ago(time_str):
    """Convert timestamp string into 'time ago' format."""
    now = datetime.now()
    past = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
    diff = now - past

    seconds = diff.total_seconds()
    minutes = int(seconds // 60)
    hours = int(seconds // 3600)
    days = int(seconds // 86400)

    if seconds < 60:
        return "Just now"
    elif minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    else:
        return f"{days} day{'s' if days != 1 else ''} ago"

# ----------ROUTES----------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_comment', methods=['POST'])
def add_comment_route():
    username = request.form['username']
    comment = request.form['comment']
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO connections (username, comment, timestamp)
        VALUES (?, ?, ?)
    ''', (username, comment, timestamp))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Comment added successfully.'})

@app.route('/get_comments', methods=['GET'])
def get_comments_route():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, comment, timestamp FROM connections ORDER BY id DESC")
    rows = cursor.fetchall()
    comments = []
    for row in rows:
        comments.append({
            'id': row['id'],
            'username': row['username'],
            'comment': row['comment'],
            'timestamp': time_ago(row['timestamp'])  # <-- formatted here
        })
    conn.close()
    return jsonify(comments)

@app.route('/update_comment', methods=['POST'])
def update_comment_route():
    comment_id = request.form['comment_id']
    new_comment = request.form['new_comment']
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE connections
        SET comment = ?, timestamp = ?
        WHERE id = ?
    ''', (new_comment, timestamp, comment_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected > 0:
        return jsonify({'message': 'Comment updated successfully.'})
    else:
        return jsonify({'message': 'No comment found with that ID.'}), 404

@app.route('/delete_comment', methods=['POST'])
def delete_comment_route():
    comment_id = request.form['comment_id']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM connections WHERE id = ?", (comment_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected > 0:
        return jsonify({'message': 'Comment deleted successfully.'})
    else:
        return jsonify({'message': 'No comment found with that ID.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
