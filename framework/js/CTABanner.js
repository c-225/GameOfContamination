class CTABanner{

  constructor() {
      this.createHTMLStructure();
      this.navbar = this.getNavbar();
      this.create_favicon();
  
  }

  /**
   * Returns the navigation bar element.
   * @returns {HTMLElement} The navbar DOM element.
   */
  getNavbar() {
    return document.getElementById("navbar0");
  }

  /**
   * Returns the canvas element.
   * @returns {HTMLElement} The canvas DOM element.
   */
  getCanvas() {
    return document.getElementById("canvas2");
  }

  /**
   * Returns the container element.
   * @returns {HTMLElement} The container DOM element.
   */
  getContainer() {
    return document.getElementById("container0");
  }

  /**
   * Toggles the visibility of the dropdown menu.
   */
  Deroulant() {
    document.getElementById("myDropdown").classList.toggle("show");
  }

  /**
   * Opens a modal dialog with the specified ID.
   * @param {string} modalId - The ID of the modal to open.
   */
  openModal(modalId) {
    console.log(`Opening modal with ID: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "block";
    } else {
      console.error("Modal not found.");
    }
  }

  /**
   * Closes a modal dialog with the specified ID.
   * @param {string} modalId - The ID of the modal to close.
   */
  closeModal(modalId) {
    console.log(`Closing modal with ID: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
    }
  }

  isDragging = false;
  offsetX;
  offsetY;
  currentModal;
  
  /**
   * Initiates dragging of a modal element.
   * @param {MouseEvent} event - The mouse event that triggered the drag.
   */
  startDrag(event, modalId = "parametersModal") {
    this.isDragging = true;
    this.currentModal = document.getElementById(modalId);
    if (!this.currentModal) {
      console.error(`Modal with ID ${modalId} not found.`);
      return;
    }

    // Calculer l'offset par rapport à la souris
    this.offsetX = event.clientX - this.currentModal.getBoundingClientRect().left;
    this.offsetY = event.clientY - this.currentModal.getBoundingClientRect().top;

    // Écouter les événements de déplacement et d'arrêt
    document.addEventListener("mousemove", this.drag.bind(this));
    document.addEventListener("mouseup", this.stopDrag.bind(this));
  }

  /**
   * Updates the position of the modal during dragging.
   * @param {MouseEvent} event - The mouse event with current cursor position.
   */
  drag(event) {
    if (!this.isDragging || !this.currentModal) return;

   
    this.currentModal.style.left = `${event.clientX - this.offsetX}px`;
    this.currentModal.style.top = `${event.clientY - this.offsetY}px`;
    this.currentModal.style.right = "auto";
  }

  /**
   * Stops the dragging operation for the modal.
   */
  stopDrag() {
    this.isDragging = false;
    document.removeEventListener("mousemove", this.drag.bind(this));
    document.removeEventListener("mouseup", this.stopDrag.bind(this));
  }

  /**
   * Gets the content element of a modal with the specified ID.
   * @param {string} modalId - The ID of the modal whose content is requested.
   * @returns {HTMLElement} The modal content DOM element.
   */
  getModal_content(modalId) {
    console.log(`Getting modal content with ID: ${modalId}`);
    return document.getElementById(`${modalId}-content`);
  }

  /**
   * Creates a modal dialog with the specified ID.
   * @param {string} modalId - The ID to assign to the created modal.
   */
  create_modal(modalId) {
    console.log(`Creating modal with ID: ${modalId}`);
    const modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal";
    document.body.appendChild(modal);

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.id = `${modalId}-content`;

    modal.appendChild(modalContent);

    const closeModalSpan = document.createElement("span");
    closeModalSpan.className = "close";
    closeModalSpan.innerHTML = "&times;";
    closeModalSpan.onclick = () => this.closeModal(modalId);
    modalContent.appendChild(closeModalSpan);

    const modalTitle = document.createElement("h2");
    modalTitle.textContent = "Parameters";
    modalContent.appendChild(modalTitle);

    this.style_modal(modal);
    this.style_modal_content(modalContent);
    this.style_close(closeModalSpan);
  }

  /**
   * Creates a dropdown menu in the navbar.
   * @param {Object} options - Configuration options for the dropdown.
   * @param {string} [options.parentId="navbar0"] - ID of the parent element.
   * @param {string} options.buttonText - Text to display on the dropdown button.
   * @param {string} options.menuId - ID for the dropdown menu.
   */
  create_dropdown({ parentId = "navbar0", buttonText, menuId }) {
    const parent = document.getElementById(parentId);
    if (!parent) {
      console.error(`Parent element with id ${parentId} not found.`);
      return;
    }
  
    // Create the dropdown menu container
    const dropdownMenu = document.createElement("div");
    dropdownMenu.className = "menu_deroulant";
    parent.appendChild(dropdownMenu);
  
    // Create the dropdown button
    const dropdownButton = document.createElement("button");
    dropdownButton.className = "dropbtn child"; // Adding "child" class to inherit styles
    dropdownButton.textContent = buttonText;
    dropdownButton.id = `dropbtn-${menuId}`; 
    dropdownButton.onclick = () => this.toggleDropdown(menuId); 
    dropdownMenu.appendChild(dropdownButton);
  
    // Create the dropdown content container
    const dropdownContent = document.createElement("div");
    dropdownContent.className = "dropdown-content";
    dropdownContent.id = menuId;
    dropdownMenu.appendChild(dropdownContent);
  }  
  
  /**
   * Adds items to a dropdown menu.
   * @param {string} menuId - The ID of the dropdown menu.
   * @param {Array<Object>} items - Array of items to add to the dropdown.
   * @param {string} items[].text - Text for the dropdown item.
   * @param {string} [items[].href] - Optional href attribute for the item.
   * @param {Function} [items[].onClick] - Optional click handler for the item.
   */
  create_dropdown_list(menuId, items) {
    const dropdownContent = document.getElementById(menuId);
    if (!dropdownContent) {
      console.error(`Dropdown content with id ${menuId} not found.`);
      return;
    }

    items.forEach(item => {
      const link = document.createElement("a");
      link.href = item.href || "#"; // Définit l"URL ou laisse vide si non spécifié
      link.textContent = item.text;
      link.onclick = item.onClick || null; // Associe la fonction si spécifiée
      dropdownContent.appendChild(link);
    });
    this.style_dropdown_content_a();
    this.style_hover();
  }

  /**
   * Sets up a global click handler for dropdown menus and modals.
   * Closes dropdowns and modals when clicking outside them.
   * @param {Window} window - The window object to attach the click handler to.
   */
  Open_dropdown(window) {
    window.onclick = function (event) {
      // Ferme le menu déroulant si l'utilisateur clique à l'extérieur
      if (!event.target.matches(".dropbtn")) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        Array.from(dropdowns).forEach(dropdown => {
          if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
            dropdown.style.display = "none"; // Assure que le menu est masqué
          }
        });
      }

      // Ferme le modal si l'utilisateur clique en dehors
      const modal = document.getElementById("parametersModal");
      if (event.target === modal) {
        modal.style.display = "none";
      }
    }
  }

  /**
   * Toggles the visibility of a dropdown menu.
   * @param {string} menuId - The ID of the dropdown menu to toggle.
   */
  toggleDropdown(menuId) {
    const dropdown = document.getElementById(menuId);
    if (dropdown) {
      const isShown = dropdown.classList.contains("show");
      dropdown.classList.toggle("show", !isShown); // Ajoute/retire la classe "show"
      dropdown.style.display = isShown ? "none" : "block"; // Met à jour le style
    }
  }

  /**
   * Creates and inserts a button into the navbar.
   * @param {Object} options - Button configuration options.
   * @param {string} [options.text="Click me!"] - Text to display on the button.
   * @param {Function} [options.onClick] - Function to execute when the button is clicked.
   * @param {string} [options.position="before"] - Position relative to referenceElement.
   * @param {HTMLElement} [options.referenceElement=null] - Reference element for positioning.
   * @param {Array<string>} [options.classes=[]] - CSS classes to apply to the button.
   * @returns {HTMLElement} - The created button element.
   */
  create_button({ text = "Click me!", onClick = () => alert("Button clicked!"), position = "before", referenceElement = null, classes = [] }) {
    var container = this.navbar;
    const button = document.createElement("button");
    button.textContent = text;
  
    // Add custom classes for styling, including 'child' and any passed classes
    button.classList.add("child", ...classes);
    
    // Event listener for the button click
    button.onclick = onClick;
    button.position = position;
  
    // Positioning the button based on reference element and position
    if (referenceElement && container.contains(referenceElement)) {
      if (position === "before") {
        container.insertBefore(button, referenceElement);
      } else if (position === "after") {
        container.insertBefore(button, referenceElement.nextSibling);
      }
    } else {
      container.appendChild(button);
    }
    this.style_navbar_children(container);
    return button;
  }
  

  /**
   * Creates the basic HTML structure for the banner.
   * Includes a container, navbar, and logo.
   */
  createHTMLStructure() {
    const container = document.createElement("div");
    container.className = "container";
    document.body.appendChild(container);
    container.id = "container0";

    const navbar = document.createElement("div");
    navbar.className = "navbar";
    navbar.id = "navbar0";
    container.appendChild(navbar);
    navbar.style.width = window.innerWidth;

    const logoLink = document.createElement("a");
    logoLink.href = "https://portail.terra-numerica.org/games";
    logoLink.className = "no_hover";
    navbar.appendChild(logoLink);

    const logoImg = document.createElement("img");
    logoImg.src = "https://terra-numerica.org/files/2020/10/cropped-favicon-rond.png";
    logoLink.appendChild(logoImg);
    logoImg.style.width = "40px";
  }

  /**
   * Applies styles to navbar child elements.
   * @param {HTMLElement} navbar - The navbar element to style.
   */
  style_navbar_children(navbar) {
    const children = navbar.children;
    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      
      element.style.float = "left";
      element.style.textAlign = "center";
      element.style.padding = "14px 16px";
    }
  }



  /**
   * Creates and appends a favicon link element to the document head.
   * This favicon is used for the local page.
    */

  create_favicon() {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = "https://terra-numerica.org/files/2020/10/cropped-favicon-rond.png";
    document.head.appendChild(link);
  }

  /**
   * Applies styles to a modal element.
   * @param {HTMLElement} element - The modal element to style.
   */
  style_modal(element) {
    if (!element) {
      console.error("Modal element not found.");
      return;
    }

    element.style.display = "none";
    element.style.position=" fixed";
    element.style.top=" 50%";
    element.style.right=" 10%"; 
    element.style.width="300px";
    element.style.backgroundColor="transparent";
    element.style.border="none";
    element.style.boxShadow=" none";
    element.style.padding="15px";
    element.style.zIndex="1000";

    element.addEventListener ="startDrag(event)";
  }

  /**
   * Applies styles to HTML and body elements.
   * @param {HTMLElement} element - The element to style.
   */
  style_body_html (element){
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.display = "flex";
    element.style.justifyContent = "center";
    element.style.alignItems = "center";
  }

  /**
   * Applies styles to the main container element.
   * @param {HTMLElement} element - The container element to style.
   */
  style_container0(element) {
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.display = "flex";
    element.style.flexDirection = "column";
  }

  /**
   * Applies reset styles to all elements in the document.
   */
  style_any (){
    const elements = document.querySelectorAll("*");
    for (let i = 0; i < elements.length; i++) {
      elements[i].style.margin = "0";
      elements[i].style.padding = "0";
      elements[i].style.boxSizing = "border-box";
    }
  }

  /**
   * Applies styles to the navbar element.
   */
  style_navbar(){
    const navbar = document.getElementById("navbar0");
    navbar.style.backgroundColor = "#24a1eb";
    navbar.style.overflow = "visible";
    navbar.style.fontFamily ="Nunito,sans-serif";
    navbar.style.textAlign = "center";
  }

  /**
   * Applies styles to a dropdown element.
   * @param {(string|HTMLElement)} elementOrId - The dropdown element or its ID.
   */
  style_dropdown(elementOrId){
    let element;
      if (typeof elementOrId === 'string') {
        element = document.getElementById(elementOrId);
      } else {
        element = elementOrId;
      }

      if (!element) {
        console.error("Dropdown element not found.");
        return;
      }
    element.style.float = "left";
    element.style.overflow = "hidden";
    element.style.cursor = "pointer";
    element.style.fontSize = "16px";
    element.style.border = "none";
    element.style.outline = "none";
    element.style.color = "white";
    element.style.padding = "14px 16px";
    element.style.backgroundColor = "#24a1eb";
    element.style.fontFamily = "inherit";
    element.style.margin = "0";
  }

  /**
   * Applies styles to a dropdown button element.
   * @param {(string|HTMLElement)} elementOrId - The button element or its ID.
   */
  style_dropbtn(elementOrId) {
    let element;
    if (typeof elementOrId === 'string') {
      element = document.getElementById(elementOrId);
    } else {
      element = elementOrId;
    }

    if (!element) {
      console.error("Dropbtn element not found.");
      console.error("Dropbtn id: " + elementOrId);
      return;
    }

    element.style.cursor = "pointer";
    element.style.fontSize = "16px";
    element.style.border = "none";
    element.style.outline = "none";
    element.style.color = "white";
    element.style.padding = "none";
    element.style.backgroundColor = "#24a1eb";
    element.style.fontFamily = "inherit";
    element.style.margin = "0";
    element.style.textAlign = "center";
  }

  /**
   * Adds hover effect styles to navbar links and buttons.
   */
  style_hover() {
    const navbarLinks = document.querySelectorAll(".navbar a:not(.no_hover)");
    navbarLinks.forEach(link => {
      link.addEventListener("mouseover", () => {
        link.style.backgroundColor = "#f9bb12";
      });
      link.addEventListener("mouseout", () => {
        link.style.backgroundColor ="inherit"; 
      });
    });
    const dropdowns = document.querySelectorAll(".dropdown");
    dropdowns.forEach(dropdown => {
      const dropbtn = dropdown.querySelector(".dropbtn");
      dropdown.addEventListener("mouseover", () => {
        if (dropbtn) dropbtn.style.backgroundColor = "#f9bb12";
      });
      dropdown.addEventListener("mouseout", () => {
        if (dropbtn) dropbtn.style.backgroundColor = ""; 
      });
    });
    const allButtons = document.querySelectorAll("button", "  .dropdown-content");
    allButtons.forEach(button => {
      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "#f9bb12";
      });
      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "inherit"; 
      });
      button.addEventListener("focus", () => {
        button.style.backgroundColor = "#f9bb12";
      });
      button.addEventListener("blur", () => {
        button.style.backgroundColor = "inherit"; 
      });
    });
  }

  /**
   * Applies styles to dropdown content containers.
   */
  style_dropdown_content() {
    const dropdownContents = document.querySelectorAll('.dropdown-content');

    dropdownContents.forEach(dropdown => {
      dropdown.style.display = 'none';
      dropdown.style.position = 'absolute';
      dropdown.style.backgroundColor = '#24a1eb';
      dropdown.style.minWidth = '160px';
      dropdown.style.boxShadow = '0px 8px 16px 0px rgba(0,0,0,0.2)';
      dropdown.style.zIndex = '1';
      
    });
  }

  /**
   * Applies styles to links within dropdown content.
   */
  style_dropdown_content_a() {
    // Styles pour .dropdown-content a
    const dropdownLinks = document.querySelectorAll('.dropdown-content a');
    dropdownLinks.forEach(link => {
      link.style.float = 'none';
      link.style.color = 'white';
      link.style.padding = '12px 16px';
      link.style.textDecoration = 'none';
      link.style.display = 'block';
      link.style.textAlign = 'left';
    });
  }

  /**
   * Applies styles to parameters dropdown content.
   */
  style_dropdown_content_parameters() {
    const parametersDropdowns = document.querySelectorAll('.dropdown-content');

    parametersDropdowns.forEach(button => {
      button.style.cursor = 'pointer';
      button.style.color = 'white';
      button.style.padding = '12px 16px';
      button.style.textDecoration = 'none';
      button.style.display = 'block';
      button.style.textAlign = 'left';
      button.style.backgroundColor = '#24a1eb';
      button.style.fontSize = '16px';
      button.style.border = 'none';
      button.style.outline = 'none';
      button.style.display = 'none';
    });
  }

  /**
   * Applies styles to modal content elements.
   */
  style_modal_content() {
    const modalContent = document.querySelectorAll('.modal-content');
    modalContent.forEach(content => {
      content.style.backgroundColor = 'white';
      content.style.margin = '15% auto';
      content.style.padding = '20px';
      content.style.borderRadius = '8px';  
      content.style.width = '300px';
      content.style.textAlign = 'center';
      content.style.position = 'relative';
      content.style.cursor="grab";
    });
  }

  /**
   * Applies styles to modal close buttons.
   */
  style_close() {
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
      button.style.color = 'black';
      button.style.fontSize = '28px';
      button.style.fontWeight = 'bold';
      button.style.cursor = 'pointer';
      button.style.right = '20px';
      button.style.top='10px';
      button.style.position = 'absolute';
    });
  }

  /**
   * Applies styles to buttons within modal content.
   */
  style_modal_content_button() {
    const modalContentButtons = document.querySelectorAll('.modal-content button');
    modalContentButtons.forEach(button => {
      button.style.display = 'block';
      
      button.style.padding = '14px 20px';
      button.style.cursor = 'pointer';
      button.style.margin = '10px auto';
    });
  }
}

export default CTABanner;