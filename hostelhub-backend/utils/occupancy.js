const getOccupancyNumber = (occupancyType) => {
  const occupancyMap = {
    IN_1: 1,
    IN_2: 2,
    IN_3: 3,
    IN_4: 4,
  };
  return occupancyMap[occupancyType] || 1;
};

const calculateTotalSpots = (totalRooms, occupancyType) => {
  return totalRooms * getOccupancyNumber(occupancyType);
};

module.exports = {
  getOccupancyNumber,
  calculateTotalSpots,
};
