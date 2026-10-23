import { defineStore } from 'pinia'

// 选座临时状态：在「场次 → 选座 → 下单」流程间传递影片、场次、已选座位
export const useBookingStore = defineStore('booking', {
  state: () => ({
    movie: null,      // 影片对象
    showtime: null,   // 场次对象（含 price / show_date / show_time / hall_name 等）
    selectedSeats: [] // [{ id, row, col }]
  }),
  actions: {
    setMovie(movie) { this.movie = movie },
    setShowtime(showtime) { this.showtime = showtime },
    setSelectedSeats(seats) { this.selectedSeats = seats },
    clear() {
      this.movie = null
      this.showtime = null
      this.selectedSeats = []
    }
  }
})