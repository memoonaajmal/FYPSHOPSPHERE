"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import emailjs from '@emailjs/browser';
import styles from "../../../../styles/footerAboutPage.module.css";

export default function ContactPage() {
  const formRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Replace these with your actual EmailJS credentials
      const result = await emailjs.sendForm(
        'service_91kmtzo',      // Replace with your Service ID
        'template_67y8r8i',     // Replace with your Template ID
        formRef.current,
        'FjvUwPeQXShUVfBok'       // Replace with your Public Key
      );

      console.log('Email sent successfully:', result.text);
      setSubmitStatus('success');
      formRef.current.reset(); // Clear the form
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroShapes}>
          <div className={styles.shape1}></div>
          <div className={styles.shape2}></div>
          <div className={styles.shape3}></div>
          <div className={styles.shape4}></div>
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heading}>Contact Us</h1>
          <p className={styles.tagline}>
            We're Here to Help You
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>24/7 Support</span>
            <span className={styles.badge}>Quick Response</span>
            <span className={styles.badge}>Expert Team</span>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            Have questions, feedback, or need assistance? Our dedicated support team at 
            <span className={styles.highlight}> ShopSphere</span> is ready to help you with any inquiries. 
            Whether you need help with an order, have technical questions, or want to provide feedback, 
            we're just a message away.
          </p>
          <p className={styles.text}>
            <strong>Email:</strong> <a href="mailto:fa22-bse-025@cuilahore.edu.pk" style={{color: 'var(--blue)', textDecoration: 'none'}}>fa22-bse-025@cuilahpre.edu.pk</a><br/>
            <strong>Phone:</strong> <a href="tel:+923000000000" style={{color: 'var(--blue)', textDecoration: 'none'}}>+92 300 0000000</a><br/>
            <strong>Hours:</strong> Monday - Friday: 9 AM - 6 PM PST | Saturday: 10 AM - 4 PM PST
          </p>
          <p className={styles.text}>
            We strive to respond to all inquiries within 24 hours during business days. For urgent 
            matters, please use our phone support line.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Send Us a Message</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text} style={{marginBottom: '10px'}}>
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
          <p className={styles.text} style={{marginBottom: '30px', fontSize: '0.95rem', color: 'var(--muted)'}}>
            Your message will be sent to: <strong style={{color: 'var(--blue)'}}>fa22-bse-025@cuilahore.edu.pk</strong>
          </p>
          <form ref={formRef} onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy)'}}>
                  First Name *
                </label>
                <input 
                  type="text" 
                  name="from_name"
                  required
                  disabled={isSubmitting}
                  style={{
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '2px solid var(--border)',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy)'}}>
                  Last Name *
                </label>
                <input 
                  type="text" 
                  name="from_lastname"
                  required
                  disabled={isSubmitting}
                  style={{
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '2px solid var(--border)',
                    fontSize: '1rem'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
            
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy)'}}>
                Email Address *
              </label>
              <input 
                type="email" 
                name="from_email"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  border: '2px solid var(--border)',
                  fontSize: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy)'}}>
                Subject *
              </label>
              <input 
                type="text" 
                name="subject"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  border: '2px solid var(--border)',
                  fontSize: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy)'}}>
                Message *
              </label>
              <textarea 
                name="message"
                required
                disabled={isSubmitting}
                rows={6}
                style={{
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  border: '2px solid var(--border)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div style={{
                padding: '15px 20px',
                background: 'rgba(0, 184, 148, 0.1)',
                border: '2px solid var(--success)',
                borderRadius: '10px',
                color: 'var(--success)',
                fontWeight: '600'
              }}>
                ✅ Message sent successfully! We'll get back to you soon.
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div style={{
                padding: '15px 20px',
                background: 'rgba(214, 48, 49, 0.1)',
                border: '2px solid var(--danger)',
                borderRadius: '10px',
                color: 'var(--danger)',
                fontWeight: '600'
              }}>
                ❌ Failed to send message. Please try again or email us directly.
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '16px 48px',
                background: isSubmitting 
                  ? 'var(--muted)' 
                  : 'linear-gradient(135deg, var(--blue), var(--blue-light), var(--success))',
                backgroundSize: '200% 200%',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                alignSelf: 'flex-start'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(39, 70, 144, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Message ✉️'}
            </button>
          </form>

        </div>
      </section>

      {/* FAQ Preview Section */}
      <section className={styles.section}>
        <div className={styles.techCard}>
          <div className={styles.techIcon}>💡</div>
          <h2 className={styles.techTitle}>Frequently Asked Questions</h2>
          <p className={styles.techText}>
            <strong>Q: What should I do if my order is delayed?</strong><br/>
            A: Order delays can occur due to high demand or shipping issues. Please check your order 
            tracking first. If your order is delayed beyond the estimated delivery date, contact us 
            immediately at "fa22-bse-025@cuilahore.edu.pk" with your order number.
          </p>

          <p className={styles.techText} style={{marginTop: '20px'}}>
            <strong>Q: What is your return policy?</strong><br/>
            A: We offer a 30-day return policy for most items. Products must be unused and in original 
            packaging. Visit our Terms & Conditions page for complete details.
          </p>
          <p className={styles.techText} style={{marginTop: '20px'}}>
            <strong>Q: How long does shipping take?</strong><br/>
            A: Standard shipping typically takes 5-7 business days. Express shipping options are 
            available at checkout for faster delivery (2-3 business days).
          </p>

        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaShapes}>
          <div className={styles.ctaShape1}></div>
          <div className={styles.ctaShape2}></div>
          <div className={styles.ctaShape3}></div>
        </div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>We're Here to Help!</h2>
          <p className={styles.ctaText}>
            Whether you have a question, feedback, or just want to say hello, 
            don't hesitate to reach out.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className={styles.heroButton}>
              <span>Back to Home</span>
              <span className={styles.buttonArrow}>→</span>
            </Link>
          </div>
        </div>
        <div className={styles.ctaDecoration}></div>
      </section>
    </div>
  );
}