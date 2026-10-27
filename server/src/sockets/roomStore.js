// In-memory registry of rooms that are open right now. Persistent history lives in MongoDB (Session model).
const rooms = new Map(); // code -> room

function generateCode() {
  // 4 digits keeps the "type it on your phone" promise; collisions are checked against open rooms only.
  for (let i = 0; i < 200; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!rooms.has(code)) return code;
  }
  return null; // practically full
}

function findByHostUser(userId) {
  for (const room of rooms.values()) if (room.hostUserId === userId) return room;
  return null;
}

module.exports = { rooms, generateCode, findByHostUser };
