using System.ComponentModel.DataAnnotations;

namespace HotelBookingPlatform.Models
{
    public class BookingAvailability
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string PropertyId { get; set; }
        
        [Required]
        public DateTime Date { get; set; }
        
        [Required]
        public bool IsAvailable { get; set; } = true;
        
        public string? BookingId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Property Property { get; set; }
        public virtual Booking? Booking { get; set; }
    }
}