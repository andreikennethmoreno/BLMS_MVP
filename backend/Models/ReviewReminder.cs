using System.ComponentModel.DataAnnotations;

namespace HotelBookingPlatform.Models
{
    public class ReviewReminder
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string BookingId { get; set; }
        
        [Required]
        public string CustomerId { get; set; }
        
        [Required]
        public DateTime CheckoutDate { get; set; }
        
        [Required]
        public DateTime ReminderSentAt { get; set; }
        
        public bool IsCompleted { get; set; } = false;
        
        public DateTime? CompletedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Booking Booking { get; set; }
        public virtual User Customer { get; set; }
    }
}