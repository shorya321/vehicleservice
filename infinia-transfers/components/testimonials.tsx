"use client"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonialsData = [
  {
    name: "Edward Smith",
    location: "Silicon Oasis District Dubai",
    date: "26 Jun 2023",
    rating: 5,
    feedback: "Great driver - turned up on time, helped with bags and drove nicely - thank you.",
  },
  {
    name: "Tatiana Makhrova",
    location: "Dubai International Airport",
    date: "09 May 2021",
    rating: 5,
    feedback:
      "As usual, all was amazing: wonderful car (Lexus), all was on time, very friendly driver. I appreciate the service, that I always use.",
  },
  {
    name: "Kandrashova Iarysa",
    location: "Ras Al Khaimah",
    date: "27 Mar 2021",
    rating: 5,
    feedback:
      "Really great service. Recommended 100%. Will use it again and again every time in Dubai. Better then local taxi. Great...",
  },
]

const ReviewStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-luxury-gold fill-luxury-gold" : "text-luxury-lightGray/30"}`}
      />
    ))}
  </div>
)

export function Testimonials() {
  return (
    <div className="section-padding">
      <div className="luxury-container">
        <motion.div
          className="section-title-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Customer Reviews</h2>
          <div className="section-divider"></div>
          <div className="flex justify-center items-center space-x-2 mb-2">
            <Star className="w-7 h-7 text-luxury-gold fill-luxury-gold" />
            <span className="text-3xl font-serif text-luxury-pearl">4.6</span>
            <span className="text-luxury-lightGray">from 7,500+ reviews</span>
          </div>
          <p className="section-subtitle">
            See why our customers are delighted by their experiences. Discover how we make every trip special!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="luxury-card luxury-card-hover flex flex-col p-6 h-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-serif text-lg text-luxury-pearl">{testimonial.name}</h4>
                  <p className="text-xs text-luxury-lightGray/80">{testimonial.location}</p>
                </div>
                <ReviewStars rating={testimonial.rating} />
              </div>
              <p className="text-xs text-luxury-lightGray/70 mb-4">{testimonial.date}</p>
              <Quote className="w-6 h-6 text-luxury-gold/30 mb-2 self-start" />
              <p className="text-sm text-luxury-lightGray italic mb-5 flex-grow">"{testimonial.feedback}"</p>
              <Button
                variant="ghost"
                size="sm"
                className="self-start p-0 h-auto text-luxury-gold hover:text-luxury-goldLight uppercase-none tracking-normal"
              >
                Read More
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
