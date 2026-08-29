// ===================================
// REVIEW SUBMISSION SYSTEM
// ===================================
(function initReviewSystem() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const addReviewBtn = document.getElementById('addReviewBtn');
        const reviewModal = document.getElementById('reviewModal');
        const reviewModalClose = document.getElementById('reviewModalClose');
        const reviewForm = document.getElementById('reviewForm');
        const starButtons = document.querySelectorAll('.star');
        const selectedRatingInput = document.getElementById('selectedRating');
        const reviewTextarea = document.getElementById('reviewText');
        const charCount = document.getElementById('charCount');
        const reviewErrorMsg = document.getElementById('reviewErrorMsg');
        const reviewSuccessMsg = document.getElementById('reviewSuccessMsg');
        const testimonialGrid = document.querySelector('.testimonials-grid');

        if (!addReviewBtn || !reviewModal) {
            console.log('Review system: Missing elements');
            return;
        }

        // Constants
        const REVIEWS_STORAGE_KEY = 'elevixor_user_reviews';
        const MAX_REVIEWS_DISPLAY = 3;

        // Open modal
        addReviewBtn.addEventListener('click', () => {
            reviewModal.classList.add('active');
            reviewForm.style.display = 'grid';
            reviewSuccessMsg.classList.remove('show');
            resetForm();
        });

        // Close modal
        const closeModal = () => {
            reviewModal.classList.remove('active');
            resetForm();
        };

        reviewModalClose.addEventListener('click', closeModal);
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) closeModal();
        });

        // Star rating handler
        starButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const rating = btn.getAttribute('data-star');
                selectedRatingInput.value = rating;
                
                // Update UI
                starButtons.forEach(b => b.classList.remove('active'));
                for (let i = 0; i < rating; i++) {
                    starButtons[i].classList.add('active');
                }
            });

            // Hover effect
            btn.addEventListener('mouseover', (e) => {
                const rating = btn.getAttribute('data-star');
                starButtons.forEach(b => b.classList.remove('active'));
                for (let i = 0; i < rating; i++) {
                    starButtons[i].classList.add('active');
                }
            });
        });

        // Reset hover when leaving star container
        const starRatingContainer = document.getElementById('starRating');
        if (starRatingContainer) {
            starRatingContainer.addEventListener('mouseleave', () => {
                const currentRating = selectedRatingInput.value;
                starButtons.forEach(b => b.classList.remove('active'));
                if (currentRating > 0) {
                    for (let i = 0; i < currentRating; i++) {
                        starButtons[i].classList.add('active');
                    }
                }
            });
        }

        // Character counter
        reviewTextarea.addEventListener('input', (e) => {
            charCount.textContent = e.target.value.length;
        });

        // Form validation and submission
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            reviewErrorMsg.classList.remove('show');

            // Validation
            const name = document.getElementById('reviewerName').value.trim();
            const title = document.getElementById('reviewerTitle').value.trim();
            const rating = selectedRatingInput.value;
            const reviewText = reviewTextarea.value.trim();

            if (!name) {
                showReviewError('Please enter your name');
                return;
            }

            if (!rating || rating < 1 || rating > 5) {
                showReviewError('Please select a rating (1-5 stars)');
                return;
            }

            if (!reviewText) {
                showReviewError('Please write your review');
                return;
            }

            if (reviewText.length > 500) {
                showReviewError('Review text cannot exceed 500 characters');
                return;
            }

            // Save review
            saveReview({
                name,
                title,
                rating: parseInt(rating),
                text: reviewText,
                timestamp: new Date().toISOString()
            });

            // Show success message and close
            reviewForm.style.display = 'none';
            reviewSuccessMsg.classList.add('show');

            setTimeout(() => {
                closeModal();
            }, 2500);
        });

        // Save review to localStorage and update display
        function saveReview(reviewData) {
            let reviews = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY)) || [];
            
            // Add new review to beginning
            reviews.unshift(reviewData);
            
            // Keep only the latest MAX_REVIEWS_DISPLAY reviews
            reviews = reviews.slice(0, MAX_REVIEWS_DISPLAY);
            
            // Save to localStorage
            localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
            
            // Update testimonials display
            displayReviews();
        }

        // Display reviews in testimonials grid
        function displayReviews() {
            const reviews = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY)) || [];
            
            // Build the original testimonials
            const originalTestimonials = [
                {
                    initial: 'A',
                    name: 'Ankit Deshmukh',
                    title: 'Fresher, B.Tech CSE',
                    rating: 4,
                    text: '"Applied to 40+ companies with zero callbacks. Got the ATS resume done here and within 10 days I had 2 interviews lined up. The domain-specific suggestions actually made a difference."'
                },
                {
                    initial: 'S',
                    name: 'Sneha Kulkarni',
                    title: '2 yrs exp, UI/UX Designer',
                    rating: 5,
                    text: '"My portfolio site looks exactly what I had in mind. Deployed it the same day and shared the link on LinkedIn. Got 2 connection requests from HRs within a week."'
                },
                {
                    initial: 'R',
                    name: 'Ravi Teja M',
                    title: 'Final year, IT branch',
                    rating: 4,
                    text: '"Interview kit was useful for HR round prep especially. Some questions were exactly what came in my TCS interview. The resume part could use more template variety though."'
                }
            ];
            
            const visibleReviews = reviews.map(review => ({
                initial: review.name.charAt(0).toUpperCase(),
                name: review.name,
                title: review.title || 'User',
                rating: review.rating,
                text: review.text,
                isUserReview: true
            })).concat(originalTestimonials).slice(0, MAX_REVIEWS_DISPLAY);

            testimonialGrid.innerHTML = '';
            visibleReviews.forEach(review => {
                testimonialGrid.appendChild(createTestimonialCard(
                    review.initial,
                    review.name,
                    review.title,
                    review.rating,
                    review.text,
                    review.isUserReview
                ));
            });
        }

        // Create testimonial card element
        function createTestimonialCard(initial, name, title, rating, text, isUserReview = false) {
            const card = document.createElement('div');
            card.className = isUserReview ? 'testimonial-card user-review' : 'testimonial-card';
            
            const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
            
            const header = document.createElement('div');
            header.className = 'testimonial-header';
            const avatar = document.createElement('div');
            avatar.className = 'testimonial-avatar';
            avatar.textContent = initial;
            const meta = document.createElement('div');
            meta.className = 'testimonial-meta';
            const nameElement = document.createElement('h4');
            nameElement.textContent = name;
            const titleElement = document.createElement('p');
            titleElement.textContent = title;
            meta.append(nameElement, titleElement);
            header.append(avatar, meta);

            const starsElement = document.createElement('div');
            starsElement.className = 'testimonial-stars';
            starsElement.textContent = stars;
            const textElement = document.createElement('div');
            textElement.className = 'testimonial-text';
            textElement.textContent = text;
            card.append(header, starsElement, textElement);
            
            return card;
        }

        // Show error message
        function showReviewError(message) {
            reviewErrorMsg.textContent = message;
            reviewErrorMsg.classList.add('show');
            
            // Auto-hide after 4 seconds
            setTimeout(() => {
                reviewErrorMsg.classList.remove('show');
            }, 4000);
        }

        // Reset form
        function resetForm() {
            reviewForm.reset();
            selectedRatingInput.value = '0';
            charCount.textContent = '0';
            starButtons.forEach(btn => btn.classList.remove('active'));
        }

        // Load and display saved reviews on page load
        displayReviews();
    }
})();
