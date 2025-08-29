// Test script for sidebar keyboard shortcut
// This script simulates the Ctrl+B keypress to test the sidebar toggle

console.log('Testing sidebar keyboard shortcut...');

// Simulate Ctrl+B keypress
function simulateCtrlB() {
  const event = new KeyboardEvent('keydown', {
    key: 'b',
    ctrlKey: true,
    bubbles: true,
    cancelable: true
  });
  
  document.dispatchEvent(event);
  console.log('Ctrl+B keypress simulated');
}

// Test the shortcut
setTimeout(() => {
  console.log('Testing Ctrl+B shortcut in 2 seconds...');
  simulateCtrlB();
}, 2000);

// Listen for sidebar state changes
let sidebarState = false;
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const sidebar = document.querySelector('[class*="translate-x-0"]');
      if (sidebar && !sidebarState) {
        sidebarState = true;
        console.log('✅ Sidebar opened successfully via shortcut!');
      } else if (!sidebar && sidebarState) {
        sidebarState = false;
        console.log('✅ Sidebar closed successfully via shortcut!');
      }
    }
  });
});

// Start observing
setTimeout(() => {
  const body = document.body;
  observer.observe(body, { attributes: true, subtree: true });
  console.log('Observer started - watching for sidebar state changes');
}, 1000);

console.log('Test script loaded. Use Ctrl+B to toggle sidebar manually.');
