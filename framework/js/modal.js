import  CTABanner  from './CTABanner';


class Modal {
    CTABannerParameter;         // Contains the following keys: Banner, navbar, container
    
    constructor(existingBanner=null) {
        let Banner, navbar, container;
        if (existingBanner) {
            // Use the existing Banner instance
             Banner = existingBanner;
             navbar = Banner.getNavbar();
             container = Banner.getContainer();
        } else {
            // Create new Banner instance if none is provided
            Banner = new CTABanner();
             navbar = Banner.getNavbar();
             container = Banner.getContainer();
        }
      
        this.modals = {};
        this.CTABannerParameter = {"Banner": Banner, "navbar": navbar, "container": container};
        
    }




    /**
     * Get or create a permanent modal window that can be used for controls and parameters.
     * The modal is created with drag functionality and can be positioned anywhere on the screen.
     * Uses the existing CTABanner styling and functionality.
     * 
     * @param {Object} options - Configuration options for the permanent modal
     * @param {string} [options.title="Parameters"] - The title of the modal
     * @param {boolean} [options.draggable=true] - Whether the modal can be dragged
     * @param {boolean} [options.showCloseButton=true] - Whether to show a close button
     * @param {Object} [options.position] - Initial position of the modal
     * @param {number} [options.position.right=10] - Right position as percentage
     * @param {number} [options.position.top=10] - Top position as percentage
     * @param {string} [options.width="300px"] - Width of the modal
     * @param {boolean} [options.visible=true] - Whether the modal is initially visible
     * @param {string} [options.id="controlPanel"] - ID for the modal element
     * @param {string} [options.theme="light"] - Theme for the modal (light or dark)
     * @returns {Object} - An object containing methods to interact with the modal
     */
    getPermanentModal({title, draggable, showCloseButton, position, width, visible, id, theme} = {}) {
        let defaultParams = {
            title: "Parameters",
            draggable: true,
            showCloseButton: true,
            position: { right: 10, top: 10 },
            width: "300px",
            visible: true,
            id: "controlPanel",
            theme: "light"
        };
        

        if (title) defaultParams.title = title;
        if (draggable !== undefined) defaultParams.draggable = draggable;
        if (showCloseButton !== undefined) defaultParams.showCloseButton = showCloseButton;
        if (position) {
            if (position.right !== undefined) defaultParams.position.right = position.right;
            if (position.top !== undefined) defaultParams.position.top = position.top;
            
        }
        if (width) defaultParams.width = width;
        if (visible !== undefined) defaultParams.visible = visible;
        if (id) defaultParams.id = id;
        if (theme) defaultParams.theme = theme;

        // Get Banner reference for creating and styling elements
        const Banner = this.CTABannerParameter.Banner;
        
        // Check if a modal already exists
        let modal = document.getElementById(defaultParams.id);
        let modalContent;
        
        if (!modal) {
            // Create new modal using the existing Banner method
            Banner.create_modal(defaultParams.id);
            modal = document.getElementById(defaultParams.id);
            modalContent = Banner.getModal_content(defaultParams.id);
            
            // Set title
            const titleElement = modalContent.querySelector("h2");
            if (titleElement) {
                titleElement.textContent = defaultParams.title;
                titleElement.style.margin = "0 0 15px 0";
                titleElement.style.padding = "5px";
                titleElement.style.borderBottom = "1px solid #ccc";
            }


            const closeButton = modalContent.querySelector(".close");
        if (closeButton) {
            closeButton.className = "close modal-close modal-close-expanded";
            closeButton.style.backgroundColor="transparent"; 
            
            closeButton.title = "Collapse";
            closeButton.style.fontSize = "16px";
            closeButton.style.fontWeight = "bold";
            closeButton.textContent = '';
            closeButton.innerHTML = '';
            
            // Track modal state
            modalContent.dataset.collapsed = "false";
            
            // Replace onclick with toggle function
            closeButton.onclick = function() {
                toggleCollapse(modalContent, closeButton);
            };
        }
            // Hide close button if not needed
            if (!defaultParams.showCloseButton) {
                const closeButton = modalContent.querySelector(".close");
                if (closeButton) closeButton.style.display = "none";
                 }
        } else {
            modalContent = Banner.getModal_content(defaultParams.id);
            
            // Update title of existing modal
            const titleElement = modalContent.querySelector("h2");
            if (titleElement) titleElement.textContent = defaultParams.title;
        }
        
        // Update modal style and position
        modal.style.position = "fixed";
        modal.style.top = `${defaultParams.position.top}%`;
        modal.style.right = `${defaultParams.position.right}%`;
        modal.style.width = defaultParams.width;
        modal.style.display = defaultParams.visible ? "block" : "none";
        modal.style.zIndex = "1000";
        modal.style.backgroundColor = "transparent";
        
        // Apply theme
        if (defaultParams.theme === "dark") {
            modalContent.style.backgroundColor = "#333";
            modalContent.style.color = "#fff";
            const titleElement = modalContent.querySelector("h2");
            if (titleElement) titleElement.style.borderBottom = "1px solid #555";
        } else {
            modalContent.style.backgroundColor = "#24a1eb";
            modalContent.style.color = "#fff";
        }
        
        // Improve modal content styling
        modalContent.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        modalContent.style.borderRadius = "8px";
        modalContent.style.padding = "15px";
        modalContent.style.maxHeight = "80vh";
        modalContent.style.overflowY = "auto";
        
        // Make draggable using Banner's dragging functionality
        if (defaultParams.draggable) {
            modalContent.style.cursor = "move";
            const titleElement = modalContent.querySelector("h2");
            
            modalContent.addEventListener("mousedown", (e) => {
                // Start drag only if clicking on the title area, not on buttons or inputs
                if (e.target === titleElement || e.target === modalContent) {
                    Banner.startDrag(e, defaultParams.id);
                }
            });
        }
        
        // Create a container for form elements inside the modal
        let formContainer = modalContent.querySelector(".form-container");
        if (!formContainer) {
            formContainer = document.createElement("div");
            formContainer.className = "form-container";
            formContainer.style.display = "flex";
            formContainer.style.flexDirection = "column";
            formContainer.style.gap = "10px";
            formContainer.style.transition = "height 0.3s ease-in-out, opacity 0.3s ease-in-out";
            formContainer.style.overflow = "hidden";
            modalContent.appendChild(formContainer);
        }

        /**
        * Toggles the collapse/expand state of the modal with animation.
        * 
        * @param {HTMLElement} content - The modal content element to collapse/expand
        * @param {HTMLElement} button - The button element that triggers the collapse/expand
        * @private
        */
        function toggleCollapse(content,button){
            
            const formContainer = content.querySelector(".form-container");
            const isCollapsed = content.dataset.collapsed === "true";
            if (isCollapsed){
                //expand
                content.style.transition = "height 0.3s ease-in-out, opacity 0.3s ease-in-out";
                const titleHeight = content.querySelector("h2").offsetHeight;
                const fullHeight = content.scrollHeight;
                content.style.height = titleHeight+15+"px";
                content.offsetHeight; 
                content.style.height = fullHeight+"px";
                formContainer.style.opacity = 1;
                formContainer.style.display = "flex";
                content.style.overflow = "hidden";
                button.className = "close modal-close modal-close-expanded"; 
                button.title = "Collapse";
                
               

                setTimeout(() => {
                    content.style.height = "auto";
                    
                }, 300);
                content.dataset.collapsed = false;
            } else {
            const titleElement = content.querySelector("h2");
            const titleHeight = titleElement.offsetHeight;
            content.style.height = content.scrollHeight + "px";
            
            // Force reflow
            content.offsetHeight;
            
            // Animate to collapsed height
            content.style.height = titleHeight + 15 + "px";
            formContainer.style.opacity = "0";
            
            // Update button state
            button.className = "close modal-close modal-close-collapsed";
            button.title = "Expand";
            
            // Hide content after animation
            setTimeout(() => {
                if (content.dataset.collapsed === "true") {
                    formContainer.style.display = "none";
                }
            }, 300);
            
            content.dataset.collapsed = "true";
        }
    }
        
        
        // Return methods to interact with the modal
        return {
            /**
             * Adds a styled button to the modal with customizable appearance and behavior.
             * 
             * @param {string} text - The text to display on the button
             * @param {Function} onClick - The function to execute when the button is clicked
             * @param {Object} [options={}] - Configuration options for the button
             * @param {string} [options.width="80%"] - The width of the button (CSS value)
             * @param {string} [options.color="#4CAF50"] - The background color of the button
             * @param {string} [options.textColor="white"] - The text color of the button
             * @param {string} [options.hoverColor="#45a049"] - The background color when hovering
             * @returns {HTMLElement} - The created button element
             */
            addButton: (text, onClick, options = {}) => {
                // Create a button similar to how Banner creates buttons
                const button = document.createElement("button");
                button.textContent = text;
                button.onclick = onClick;
                
                // Apply styling
                button.style.display = "block";
                button.style.padding = "10px";
                button.style.margin = "10px auto";
                ;
                button.style.cursor = "pointer";
                button.style.width = options.width || "80%";
                if (theme === "dark") {
                    button.style.backgroundColor = "inherit";
                    button.style.color = options.textColor || "white";
                }
                else {
                    button.style.color = options.textColor || "#fff";
                    button.style.backgroundColor = "inherit" ;
                }

                
                
                button.style.border = "none";
                button.style.borderRadius = "40px";
                button.style.transition = "background-color 0.3s";
                
                
                
                // Add hover effects
                button.addEventListener("mouseover", () => {
                    button.style.backgroundColor = "#f9bb12";
                    
                    
                });
                
                button.addEventListener("mouseout", () => {
                    button.style.backgroundColor = "inherit";
                });
                
                formContainer.appendChild(button);
                return button;
            },
            
            /**
             * Adds a slider input to the modal for selecting numeric values.
             * 
             * @param {string} label - Text label for the slider
             * @param {number} min - Minimum value of the slider
             * @param {number} max - Maximum value of the slider
             * @param {number} value - Initial value of the slider
             * @param {Function} onChange - Function called when the slider value changes
             * @param {Object} [options={}] - Additional configuration options
             * @param {number} [options.step=1] - Step increment for the slider
             * @param {Function} [options.formatValue] - Function to format the displayed value
             * @returns {Object} - Object containing the slider, valueDisplay, and container elements
             */
            addSlider: (label, min, max, value, onChange, options = {}) => {
                const container = document.createElement("div");
                container.style.margin = "5px 0";
                container.style.textAlign = "left";
                
                const labelElement = document.createElement("label");
                labelElement.textContent = label;
                labelElement.style.display = "block";
                labelElement.style.marginBottom = "5px";
                labelElement.style.fontWeight = "bold";
                
                const sliderContainer = document.createElement("div");
                sliderContainer.style.display = "flex";
                sliderContainer.style.alignItems = "center";
                
                const slider = document.createElement("input");
                slider.type = "range";
                slider.min = min;
                slider.max = max;
                slider.step = options.step || 1;
                slider.value = value;
                slider.style.flex = "1";
                
                const valueDisplay = document.createElement("span");
                valueDisplay.textContent = options.formatValue ? options.formatValue(value) : value;
                valueDisplay.style.marginLeft = "10px";
                valueDisplay.style.minWidth = "40px";
                valueDisplay.style.textAlign = "right";
                
                slider.addEventListener("input", () => {
                    const numValue = Number(slider.value);
                    valueDisplay.textContent = options.formatValue ? options.formatValue(numValue) : numValue;
                    if (onChange) onChange(numValue);
                });
                
                sliderContainer.appendChild(slider);
                sliderContainer.appendChild(valueDisplay);
                container.appendChild(labelElement);
                container.appendChild(sliderContainer);
                formContainer.appendChild(container);
                
                return { slider, valueDisplay, container };
            },
            
            /**
             * Adds a checkbox input to the modal.
             * 
             * @param {string} label - Text label for the checkbox
             * @param {boolean} checked - Initial checked state of the checkbox
             * @param {Function} onChange - Function called when the checkbox state changes
             * @returns {Object} - Object containing the checkbox and container elements
             */
            addCheckbox: (label, checked, onChange) => {
                const container = document.createElement("div");
                container.style.margin = "5px 0";
                container.style.textAlign = "left";
                container.style.display = "flex";
                container.style.alignItems = "center";
                
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = checked;
                checkbox.style.marginRight = "10px";
                checkbox.style.transform = "scale(1.2)";
                
                const labelElement = document.createElement("label");
                labelElement.textContent = label;
                
                checkbox.addEventListener("change", () => {
                    if (onChange) onChange(checkbox.checked);
                });
                
                container.appendChild(checkbox);
                container.appendChild(labelElement);
                formContainer.appendChild(container);
                
                return { checkbox, container };
            },
            
            /**
             * Adds a dropdown select input to the modal.
             * 
             * @param {string} label - Text label for the dropdown
             * @param {Array<Object>} options - Array of options for the dropdown
             * @param {string} options[].value - Value of each option
             * @param {string} [options[].label] - Display text for each option (defaults to value if not provided)
             * @param {string} selectedValue - Initially selected value
             * @param {Function} onChange - Function called when the selected option changes
             * @returns {Object} - Object containing the select and container elements
             */
            addDropdown: (label, options, selectedValue, onChange) => {
                const container = document.createElement("div");
                container.style.margin = "5px 0";
                container.style.textAlign = "left";
                
                const labelElement = document.createElement("label");
                labelElement.textContent = label;
                labelElement.style.display = "block";
                labelElement.style.marginBottom = "5px";
                labelElement.style.fontWeight = "bold";
                
                const select = document.createElement("select");
                select.style.width = "100%";
                select.style.padding = "5px";
                select.style.borderRadius = "4px";
                
                options.forEach(opt => {
                    const optionElement = document.createElement("option");
                    optionElement.value = opt.value;
                    optionElement.textContent = opt.label || opt.value;
                    if (opt.value === selectedValue) optionElement.selected = true;
                    select.appendChild(optionElement);
                });
                
                select.addEventListener("change", () => {
                    if (onChange) onChange(select.value);
                });
                
                container.appendChild(labelElement);
                container.appendChild(select);
                formContainer.appendChild(container);
                
                return { select, container };
            },

            /**
             * Adds a color picker input to the modal.
             * 
             * @param {string} label - Text label for the color picker
             * @param {string} initialColor - Initial color value in hexadecimal format (e.g., "#FF0000")
             * @param {Function} onChange - Function called when the selected color changes
             * @returns {Object} - Object containing the colorPicker, valueDisplay, and container elements
             */
            addColorPicker: (label, initialColor, onChange) => {
                const container = document.createElement("div");
                container.style.margin = "5px 0";
                container.style.textAlign = "left";
                
                const labelElement = document.createElement("label");
                labelElement.textContent = label;
                labelElement.style.display = "block";
                labelElement.style.marginBottom = "5px";
                labelElement.style.fontWeight = "bold";
                
                const pickerContainer = document.createElement("div");
                pickerContainer.style.display = "flex";
                pickerContainer.style.alignItems = "center";
                
                const colorPicker = document.createElement("input");
                colorPicker.type = "color";
                colorPicker.value = initialColor;
                colorPicker.style.margin = "0 10px 0 0";
                
                const valueDisplay = document.createElement("span");
                valueDisplay.textContent = initialColor;
                valueDisplay.style.fontFamily = "monospace";
                
                colorPicker.addEventListener("input", () => {
                    valueDisplay.textContent = colorPicker.value;
                    if (onChange) onChange(colorPicker.value);
                });
                
                pickerContainer.appendChild(colorPicker);
                pickerContainer.appendChild(valueDisplay);
                container.appendChild(labelElement);
                container.appendChild(pickerContainer);
                formContainer.appendChild(container);
                
                return { colorPicker, valueDisplay, container };
            },

            /**
             * Adds a horizontal line separator to the modal.
             * 
             * @returns {HTMLElement} - The created separator element
             */
            addSeparator: () => {
                const separator = document.createElement("hr");
                separator.style.margin = "10px 0";
                separator.style.border = "none";
                separator.style.borderTop = "1px solid #ccc";
                formContainer.appendChild(separator);
                return separator;
            },
            
            /**
             * Adds a text label to the modal with customizable styling.
             * 
             * @param {string} text - Text content of the label
             * @param {Object} [options={}] - Styling options for the label
             * @param {string} [options.align="left"] - Text alignment ("left", "center", or "right")
             * @param {boolean} [options.bold=false] - Whether to display the text in bold
             * @param {string} [options.fontSize="inherit"] - Font size (CSS value)
             * @param {string} [options.color="inherit"] - Text color
             * @returns {HTMLElement} - The created label element
             */
            addLabel: (text, options = {}) => {
                const label = document.createElement("div");
                label.textContent = text;
                label.style.margin = "5px 0";
                label.style.textAlign = options.align || "left";
                label.style.fontWeight = options.bold ? "bold" : "normal";
                label.style.fontSize = options.fontSize || "inherit";
                label.style.color = options.color || "inherit";
                formContainer.appendChild(label);
                return label;
            },
            
            /**
             * Clears all content from the modal form container.
             */
            clear: () => {
                // Remove all content in the form container
                while (formContainer.firstChild) {
                    formContainer.removeChild(formContainer.firstChild);
                }
            },
            
            /**
             * Makes the modal visible on the screen.
             */
            show: () => {
                modal.style.display = "block";
            },
            
            /**
             * Hides the modal from the screen.
             */
            hide: () => {
                modal.style.display = "none";
            },
            
            /**
             * Toggles the visibility of the modal.
             */
            toggle: () => {
                modal.style.display = modal.style.display === "none" ? "block" : "none";
            },
            
            /**
             * Gets the modal's main DOM element.
             * 
             * @returns {HTMLElement} - The modal's DOM element
             */
            getElement: () => modal,
            
            /**
             * Gets the modal's content container DOM element.
             * 
             * @returns {HTMLElement} - The modal content's DOM element
             */
            getContentElement: () => modalContent,
              /**
                 * Toggles the collapsed state of the modal with a smooth animation.
                 * When collapsed, only the header is visible; when expanded, all content is shown.
                 * 
                 * @returns {void}
                 * @example
                 * // Toggle the modal's collapsed state
                 * modalControls.toggleCollapse();
             */
        toggleCollapse: () => {
            const button = modalContent.querySelector(".close");
            toggleCollapse(modalContent, button);
        },
        
        /**
         * Collapses the modal to show only the header with a smooth animation.
         * If the modal is already collapsed, this method has no effect.
         * 
         * @returns {void}
         * @example
         * // Collapse the modal
         * modalControls.collapse();
         */
        collapse: () => {
            if (modalContent.dataset.collapsed !== "true") {
                const button = modalContent.querySelector(".close");
                toggleCollapse(modalContent, button);
            }
        },
          /**
         * Expands the modal to show all content with a smooth animation.
         * If the modal is already expanded, this method has no effect.
         * 
         * @returns {void}
         * @example
         * // Expand a previously collapsed modal
         * modalControls.expand();
         */
          expand: () => {
            if (modalContent.dataset.collapsed === "true") {
                const button = modalContent.querySelector(".close");
                toggleCollapse(modalContent, button);
            }
        },
            
            /**
             * Gets the modal's form container DOM element.
             * 
             * @returns {HTMLElement} - The form container's DOM element
             */
            getFormContainer: () => formContainer,
            
            /**
             * Adjusts the position of the modal on the screen.
             * 
             * @param {number|string} top - Top position (percentage if number, CSS value if string)
             * @param {number|string} right - Right position (percentage if number, CSS value if string)
             */
            setPosition: (top, right) => {
                if (top !== undefined) modal.style.top = typeof top === 'number' ? `${top}%` : top;
                if (right !== undefined) modal.style.right = typeof right === 'number' ? `${right}%` : right;
            },
            
            /**
             * Sets the dimensions of the modal.
             * 
             * @param {string} width - Width of the modal (CSS value)
             * @param {string} height - Height of the modal content (CSS value)
             */
            setSize: (width, height) => {
                if (width) modal.style.width = width;
                if (height) modalContent.style.height = height;
            },
            
            /**
             * Creates a button in the navbar that toggles this modal's visibility.
             * 
             * @param {string} [buttonText="Controls"] - Text to display on the toggle button
             * @returns {HTMLElement} - The created button element
             */
            createToggleButton: (buttonText = "Controls") => {
                return this.addButtonToNavbar({
                    textButton: buttonText,
                    onclickFunction: () => modal.style.display = modal.style.display === "none" ? "block" : "none"
                });
            }
        };
    }
    

}
export default Modal;
