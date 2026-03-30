const getOccupancyNumber = (occupancyType) => {
  const occupancyMap = {
    IN_1: 1,
    IN_2: 2,
    IN_3: 3,
    IN_4: 4,
  };
  return occupancyMap[occupancyType] || 1;
};

const getOccupancyLabel = (occupancyType) => {
  const labels = {
    IN_1: "Single Room (1 Person)",
    IN_2: "Double Room (2 in a Room)",
    IN_3: "Triple Room (3 in a Room)",
    IN_4: "Quad Room (4 in a Room)",
  };
  return labels[occupancyType] || occupancyType;
};

const calculateRoomStatus = (currentOccupants, capacity) => {
  if (currentOccupants === 0) return "AVAILABLE";
  if (currentOccupants >= capacity) return "FULLY_OCCUPIED";
  return "PARTIALLY_OCCUPIED";
};

const calculateRoomTypeStats = (rooms) => {
  const stats = {
    totalRooms: rooms.length,
    availableRooms: 0,
    totalSpots: 0,
    availableSpots: 0,
  };

  rooms.forEach((room) => {
    if (room.status !== "UNDER_MAINTENANCE" && room.status !== "UNAVAILABLE") {
      stats.totalSpots += room.capacity;
      stats.availableSpots += room.capacity - room.currentOccupants;

      if (room.currentOccupants < room.capacity) {
        stats.availableRooms++;
      }
    }
  });

  return stats;
};

module.exports = {
  getOccupancyNumber,
  getOccupancyLabel,
  calculateRoomStatus,
  calculateRoomTypeStats,
};
