 // Sidebar button functionality
 document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".sidebar-buttons");
  const sections = document.querySelectorAll(".content-section");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetSection = button.getAttribute("data-section");

      // Hide all sections
      sections.forEach((section) => {
        section.classList.remove("active");
      });

      // Show the target section
      const sectionToShow = document.getElementById(targetSection);
      if (sectionToShow) {
        sectionToShow.classList.add("active");
      }
    });
  });
});