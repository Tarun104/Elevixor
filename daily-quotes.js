/**
 * Daily Motivational Quotes for Elevixor
 * Shows the last 7 days of quotes — oldest at top, newest at bottom.
 * Auto-refreshes when the day changes.
 */
(function () {
  var QUOTES = [
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Dream it. Wish it. Do it.", author: "Unknown" },
    { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
    { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Little things make big days.", author: "Unknown" },
    { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
    { text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
    { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
    { text: "Dream bigger. Do bigger.", author: "Unknown" },
    { text: "Don't wait for opportunity. Create it.", author: "Unknown" },
    { text: "Sometimes later becomes never. Do it now.", author: "Unknown" },
    { text: "The only limit to your impact is your imagination and commitment.", author: "Tony Robbins" },
    { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
    { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
    { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
    { text: "A ship in harbor is safe, but that is not what ships are built for.", author: "John A. Shedd" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" }
  ];

  var SHOW_DAYS = 7;
  var oneDay = 86400000;

  // Get day-of-year and year for a date
  function getDayInfo(d) {
    var start = new Date(d.getFullYear(), 0, 0);
    var diff = d - start;
    return { year: d.getFullYear(), day: Math.floor(diff / oneDay) };
  }

  // Get quote for a specific date
  function quoteForDate(d) {
    var info = getDayInfo(d);
    var index = ((info.day % QUOTES.length) + QUOTES.length) % QUOTES.length;
    return { text: QUOTES[index].text, author: QUOTES[index].author, date: d };
  }

  // Format date nicely
  function formatDate(d) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // Build the list of quotes (oldest first, newest last)
  function buildQuoteList() {
    var list = [];
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (var i = SHOW_DAYS - 1; i >= 0; i--) {
      var d = new Date(today.getTime() - i * oneDay);
      list.push(quoteForDate(d));
    }
    return list;
  }

  // Render
  var lastDay = null;

  function render() {
    var container = document.getElementById('dailyQuote');
    if (!container) return;

    var todayInfo = getDayInfo(new Date());
    var todayKey = todayInfo.year + '-' + todayInfo.day;

    // Only re-render if day changed
    if (lastDay === todayKey) return;
    lastDay = todayKey;

    var list = buildQuoteList();
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      var isToday = (i === list.length - 1);
      html += '<div class="dq-card' + (isToday ? ' dq-today' : '') + '">' +
        '<div class="dq-date">' + (isToday ? 'Today — ' : '') + formatDate(q.date) + '</div>' +
        '<div class="dq-text">"' + q.text + '"</div>' +
        '<div class="dq-author">— ' + q.author + '</div>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  // Initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  // Auto-check every minute if the day changed
  setInterval(function () { render(); }, 60000);
})();
