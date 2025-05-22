document.addEventListener("DOMContentLoaded", () => {
  const hourlyRateInput = document.getElementById("hourlyRate");
  const pensionPercentInput = document.getElementById("pensionPercent");
  const companyPensionPercentInput = document.getElementById(
    "companyPensionPercent",
  );
  const taxPercentInput = document.getElementById("taxPercent");
  const currentMonthSalarySpan = document.getElementById("currentMonthSalary");
  const previousMonthSalarySpan = document.getElementById(
    "previousMonthSalary",
  );
  const totalCompensationSpan = document.getElementById("totalCompensation");
  const taxLayerSpan = document.getElementById("taxLayer");
  const pensionAmountSpan = document.getElementById("pensionAmount");
  const currentMonthNameSpan = document.getElementById("currentMonthName");
  const previousMonthNameSpan = document.getElementById("previousMonthName");
  const currentMonthNameTaxSpan = document.getElementById(
    "currentMonthNameTax",
  );
  const currentMonthNamePensionSpan = document.getElementById(
    "currentMonthNamePension",
  );
  const currentMonthWorkdaysSpan = document.getElementById(
    "currentMonthWorkdays",
  );
  const previousMonthWorkdaysSpan = document.getElementById(
    "previousMonthWorkdays",
  );
  const churchTaxCheckbox = document.getElementById("churchTaxEnabled");

  // Modal elements
  const infoButton = document.getElementById("infoButton");
  const explanationModal = document.getElementById("explanationModal");
  const closeButton = document.querySelector(".close-button");

  // Modal value elements
  const modalWorkdays = document.getElementById("modalWorkdays");
  const modalHourlyRate = document.getElementById("modalHourlyRate");
  const modalTotalGross = document.getElementById("modalTotalGross");
  const modalCompanyPensionAmount = document.getElementById(
    "modalCompanyPensionAmount",
  );
  const modalRemainingGross = document.getElementById("modalRemainingGross");
  const modalEmployeePensionAmount = document.getElementById(
    "modalEmployeePensionAmount",
  );
  const modalAMBidrag = document.getElementById("modalAMBidrag");
  const modalTaxableIncome = document.getElementById("modalTaxableIncome");
  const modalTaxRate = document.getElementById("modalTaxRate");
  const modalChurchTaxItem = document.getElementById("modalChurchTaxItem");
  const modalPersonfradragValue = document.getElementById(
    "modalPersonfradragValue",
  );
  const modalBeskaeftigelsesfradragValue = document.getElementById(
    "modalBeskaeftigelsesfradragValue",
  );
  const modalJobfradragValue = document.getElementById("modalJobfradragValue");
  const modalTotalTaxes = document.getElementById("modalTotalTaxes");
  const modalNetSalary = document.getElementById("modalNetSalary");

  // --- Utility: Debounce Function ---
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // --- Cookie Functions ---

  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
  }

  function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // --- Settings Persistence ---

  function saveSettings() {
    const settings = {
      hourlyRate: hourlyRateInput.value,
      pensionPercent: pensionPercentInput.value,
      companyPensionPercent: companyPensionPercentInput.value,
      taxPercent: taxPercentInput.value,
      churchTaxEnabled: churchTaxCheckbox.checked,
    };
    setCookie("salarySettings", JSON.stringify(settings), 365); // Save for 1 year
  }

  function loadSettings() {
    const settingsCookie = getCookie("salarySettings");
    const defaultTax = 37; // Default tax rate

    if (settingsCookie) {
      try {
        const settings = JSON.parse(settingsCookie);
        // Use cookie value if defined, otherwise use defaults
        hourlyRateInput.value =
          settings.hourlyRate !== undefined ? settings.hourlyRate : 0;
        pensionPercentInput.value =
          settings.pensionPercent !== undefined ? settings.pensionPercent : 0;
        companyPensionPercentInput.value =
          settings.companyPensionPercent !== undefined
            ? settings.companyPensionPercent
            : 0;
        taxPercentInput.value =
          settings.taxPercent !== undefined ? settings.taxPercent : defaultTax;

        // Load church tax setting or default to checked (true)
        churchTaxCheckbox.checked =
          settings.churchTaxEnabled !== undefined
            ? settings.churchTaxEnabled
            : true;
      } catch (e) {
        console.error("Failed to parse settings cookie:", e);
        // Set defaults if cookie parsing fails
        hourlyRateInput.value = 0;
        pensionPercentInput.value = 0;
        companyPensionPercentInput.value = 0;
        taxPercentInput.value = defaultTax;
        churchTaxCheckbox.checked = true;
      }
    } else {
      // Set defaults if no cookie exists
      hourlyRateInput.value = 0;
      pensionPercentInput.value = 0;
      companyPensionPercentInput.value = 0;
      taxPercentInput.value = defaultTax;
      churchTaxCheckbox.checked = true;
    }
  }

  // --- Calculation Logic ---

  function getWorkdaysInMonth(year, month) {
    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let workdays = 0;

    // Iterate through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Count only weekdays (Monday through Friday)
      if (dayOfWeek > 0 && dayOfWeek < 6) {
        workdays++;
      }
    }

    return workdays;
  }

  // Helper function to get month name from month index (0-11)
  function getMonthName(month) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[month];
  }

  // Danish Tax Constants (2025 values)
  const AM_BIDRAG_RATE = 8; // Labor Market Contribution: 8%
  const PERSONFRADRAG_YEARLY = 51600; // 2025 Personal deduction allowance
  const PERSONFRADRAG_MONTHLY = PERSONFRADRAG_YEARLY / 12; // 2025 Monthly personal deduction
  const KIRKESKAT_RATE = 0.8; // Church tax: typically around 0.8%
  const BESKAEFTIGELSESFRADRAG_RATE = 12.3; // Employment deduction rate (%)
  const BESKAEFTIGELSESFRADRAG_YEARLY_MAX = 55600; // Maximum yearly employment deduction
  const BESKAEFTIGELSESFRADRAG_MONTHLY_MAX =
    BESKAEFTIGELSESFRADRAG_YEARLY_MAX / 12; // Maximum monthly employment deduction
  const JOBFRADRAG_RATE = 4.5; // Job deduction rate (%)
  const JOBFRADRAG_YEARLY_MAX = 2900; // Maximum yearly job deduction
  const JOBFRADRAG_MONTHLY_MAX = JOBFRADRAG_YEARLY_MAX / 12; // Maximum monthly job deduction

  // Helper function to calculate for a given month and year
  function calculateMonth(year, month) {
    const hourlyRate = Number.parseFloat(hourlyRateInput.value) || 0;
    const employeePensionPercent =
      Number.parseFloat(pensionPercentInput.value) || 0;
    const companyPensionPercent =
      Number.parseFloat(companyPensionPercentInput.value) || 0;
    const userDefinedTaxRate = Number.parseFloat(taxPercentInput.value) || 37; // User can override the default tax rate
    const isChurchTaxEnabled = churchTaxCheckbox.checked;

    const workdays = getWorkdaysInMonth(year, month);
    // Calculate total gross based on Danish standard 7.4-hour workday
    const totalGrossSalary = hourlyRate * workdays * 7.4; // Standard Danish workday: 7 hours and 24 minutes (7.4 hours)

    // Step 1: Calculate company pension (which is part of the negotiated hourly rate)
    const companyPensionAmount =
      totalGrossSalary * (companyPensionPercent / 100);

    // Step 2: Calculate the actual gross salary (after company pension is removed)
    const grossSalary = totalGrossSalary - companyPensionAmount;

    // Step 3: Calculate AM-bidrag (Labor Market Contribution)
    const amBidrag = grossSalary * (AM_BIDRAG_RATE / 100);

    // Step 4: Calculate employee pension contribution
    // Employee pension is deducted from gross salary before tax calculation
    const employeePensionAmount = grossSalary * (employeePensionPercent / 100);
    const totalPensionAmount = employeePensionAmount + companyPensionAmount;

    // Step 5: Calculate taxable income (after AM-bidrag and employee pension)
    const taxableIncome = grossSalary - amBidrag - employeePensionAmount;

    // Step 6: Calculate employment deduction (beskæftigelsesfradrag)
    const beskaeftigelsesfradragBase = grossSalary - amBidrag; // Based on income after AM-bidrag
    const beskaeftigelsesfradragAmount = Math.min(
      beskaeftigelsesfradragBase * (BESKAEFTIGELSESFRADRAG_RATE / 100),
      BESKAEFTIGELSESFRADRAG_MONTHLY_MAX,
    );
    const beskaeftigelsesfradragTaxValue =
      beskaeftigelsesfradragAmount * (userDefinedTaxRate / 100);

    // Step 7: Calculate job deduction (jobfradrag)
    const jobfradragAmount = Math.min(
      beskaeftigelsesfradragBase * (JOBFRADRAG_RATE / 100),
      JOBFRADRAG_MONTHLY_MAX,
    );
    const jobfradragTaxValue = jobfradragAmount * (userDefinedTaxRate / 100);

    // Step 8: Apply personal tax deduction (personfradrag)
    const personfradragTaxValue =
      PERSONFRADRAG_MONTHLY * (userDefinedTaxRate / 100);

    // Step 9: Calculate the base tax (bundskat) with all deductions applied
    const bundskat = Math.max(
      0,
      taxableIncome * (userDefinedTaxRate / 100) -
        personfradragTaxValue -
        beskaeftigelsesfradragTaxValue -
        jobfradragTaxValue,
    );

    // Step 10: Calculate church tax if applicable and enabled
    const kirkeskat = isChurchTaxEnabled
      ? taxableIncome * (KIRKESKAT_RATE / 100)
      : 0;

    // Calculate total taxes and final net salary
    const totalTaxes = amBidrag + bundskat + kirkeskat;
    // Net salary is what employee actually receives (gross - employee pension - taxes)
    const netSalary = grossSalary - employeePensionAmount - totalTaxes;

    return {
      netSalary: netSalary,
      employeePensionAmount: employeePensionAmount,
      companyPensionAmount: companyPensionAmount,
      totalPensionAmount: totalPensionAmount,
      taxLayer: taxLayer,
      grossSalary: grossSalary,
      totalGrossSalary: totalGrossSalary,
      totalTaxes: totalTaxes,
      workdays: workdays,
      hourlyRate: hourlyRate,
      employeePensionPercent: employeePensionPercent,
      companyPensionPercent: companyPensionPercent,
      taxRate: userDefinedTaxRate,
      amBidrag: amBidrag,
      taxableIncome: taxableIncome,
      bundskat: bundskat,
      kirkeskat: kirkeskat,
      isChurchTaxEnabled: isChurchTaxEnabled,
      personfradragSavings: personfradragTaxValue,
      beskaeftigelsesfradragAmount: beskaeftigelsesfradragAmount,
      beskaeftigelsesfradragTaxValue: beskaeftigelsesfradragTaxValue,
      jobfradragAmount: jobfradragAmount,
      jobfradragTaxValue: jobfradragTaxValue,
    };
  }

  // Main calculation function that updates the UI with salary information
  function calculateSalary() {
    const hourlyRate = Number.parseFloat(hourlyRateInput.value) || 0;

    if (hourlyRate <= 0) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const previousMonthDate = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      const previousMonth = previousMonthDate.getMonth();
      const previousYear = previousMonthDate.getFullYear();

      // Still show month names and workday counts even if hourly rate is invalid
      currentMonthNameSpan.textContent = getMonthName(currentMonth);
      previousMonthNameSpan.textContent = getMonthName(previousMonth);
      currentMonthNameTaxSpan.textContent = getMonthName(currentMonth);
      currentMonthNamePensionSpan.textContent = getMonthName(currentMonth);

      // Calculate and display workdays
      const currentMonthWorkdays = getWorkdaysInMonth(
        currentYear,
        currentMonth,
      );
      const previousMonthWorkdays = getWorkdaysInMonth(
        previousYear,
        previousMonth,
      );
      currentMonthWorkdaysSpan.textContent = currentMonthWorkdays;
      previousMonthWorkdaysSpan.textContent = previousMonthWorkdays;

      currentMonthSalarySpan.textContent = "Please enter a valid hourly rate.";
      totalCompensationSpan.textContent = "-";
      previousMonthSalarySpan.textContent = "-";
      taxLayerSpan.textContent = "-";
      pensionAmountSpan.textContent = "-";
      return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    // Current Month Calculation
    const currentMonthResults = calculateMonth(currentYear, currentMonth);
    const currentMonthName = getMonthName(currentMonth);
    const currentMonthWorkdays = getWorkdaysInMonth(currentYear, currentMonth);

    // Update all current month displays
    currentMonthNameSpan.textContent = currentMonthName;
    currentMonthNameTaxSpan.textContent = currentMonthName;
    currentMonthNamePensionSpan.textContent = currentMonthName;
    currentMonthWorkdaysSpan.textContent = currentMonthWorkdays;

    currentMonthSalarySpan.textContent = `${currentMonthResults.netSalary.toFixed(2)} DKK`;
    totalCompensationSpan.textContent = `${currentMonthResults.totalGrossSalary.toFixed(2)} DKK`;
    taxLayerSpan.textContent = `${currentMonthResults.totalTaxes.toFixed(0)} DKK`;
    pensionAmountSpan.textContent = `${currentMonthResults.totalPensionAmount.toFixed(2)} DKK`;

    // Previous Month Calculation
    const previousMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const previousYear = previousMonthDate.getFullYear();
    const previousMonth = previousMonthDate.getMonth(); // 0-indexed

    const previousMonthResults = calculateMonth(previousYear, previousMonth);
    const previousMonthName = getMonthName(previousMonth);
    const previousMonthWorkdays = getWorkdaysInMonth(
      previousYear,
      previousMonth,
    );

    // Update previous month displays
    previousMonthNameSpan.textContent = previousMonthName;
    previousMonthWorkdaysSpan.textContent = previousMonthWorkdays;
    previousMonthSalarySpan.textContent = `${previousMonthResults.netSalary.toFixed(2)} DKK`;
    // Note: We only display the tax layer and pension amount for the current month based on the UI layout
    // If you wanted to show previous month's layer/pension, you would need additional spans in HTML.

    saveSettings(); // Save settings after calculation
  }

  // --- Event Listeners ---

  // Debounce calculation to avoid rapid updates
  const debouncedCalculate = debounce(calculateSalary, 300); // 300ms delay

  hourlyRateInput.addEventListener("input", debouncedCalculate);
  pensionPercentInput.addEventListener("input", debouncedCalculate);
  companyPensionPercentInput.addEventListener("input", debouncedCalculate);
  taxPercentInput.addEventListener("input", debouncedCalculate);
  churchTaxCheckbox.addEventListener("change", debouncedCalculate);

  // --- Modal functionality ---

  // Function to update modal with current calculation values
  function updateModalValues() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const calculation = calculateMonth(currentYear, currentMonth);

    // Update all modal values with current calculation
    modalWorkdays.textContent = `${calculation.workdays} days`;
    modalHourlyRate.textContent = `${calculation.hourlyRate.toFixed(2)} DKK`;
    modalTotalGross.textContent = `${calculation.totalGrossSalary.toFixed(2)} DKK`;
    modalCompanyPensionAmount.textContent =
      `${calculation.companyPensionAmount.toFixed(2)} DKK`;
    modalRemainingGross.textContent = `${calculation.grossSalary.toFixed(2)} DKK`;
    modalEmployeePensionAmount.textContent =
      `${calculation.employeePensionAmount.toFixed(2)} DKK`;
    modalAMBidrag.textContent = `${calculation.amBidrag.toFixed(2)} DKK`;
    modalTaxableIncome.textContent = `${calculation.taxableIncome.toFixed(2)} DKK`;
    modalTaxRate.textContent = `${calculation.taxRate} %`;

    // Show or hide church tax based on checkbox
    if (calculation.isChurchTaxEnabled) {
      modalChurchTaxItem.style.display = "list-item";
      
      // If the element structure doesn't exist yet, create it
      if (modalChurchTaxItem.innerHTML.indexOf('modalChurchTaxAmount') === -1) {
        modalChurchTaxItem.innerHTML = `Church tax: <span id="modalChurchTaxRate">0.8 %</span> = <span id="modalChurchTaxAmount">0 DKK</span>`;
      }
      
      // Get references to the span elements
      const modalChurchTaxRateElement = document.getElementById("modalChurchTaxRate");
      const modalChurchTaxAmountElement = document.getElementById("modalChurchTaxAmount");
      
      // Update the values in the spans
      modalChurchTaxRateElement.textContent = "0.8 %";
      modalChurchTaxAmountElement.textContent = `${calculation.kirkeskat.toFixed(2)} DKK`;
    } else {
      modalChurchTaxItem.style.display = "none";
    }

    // Display tax savings from each deduction
    modalPersonfradragValue.textContent =
      `${calculation.personfradragSavings.toFixed(2)} DKK`;
    modalBeskaeftigelsesfradragValue.textContent =
      `${calculation.beskaeftigelsesfradragTaxValue.toFixed(2)} DKK`;
    modalJobfradragValue.textContent =
      `${calculation.jobfradragTaxValue.toFixed(2)} DKK`;
    modalTotalTaxes.textContent = `${calculation.totalTaxes.toFixed(2)} DKK`;
    modalNetSalary.textContent = `${calculation.netSalary.toFixed(2)} DKK`;
  }

  // Open modal when info button is clicked
  infoButton.addEventListener("click", () => {
    updateModalValues(); // Update modal values before showing
    explanationModal.style.display = "block";
  });

  // Close modal when close button is clicked
  closeButton.addEventListener("click", () => {
    explanationModal.style.display = "none";
  });

  // Close modal when clicking outside the modal content
  window.addEventListener("click", (event) => {
    if (event.target === explanationModal) {
      explanationModal.style.display = "none";
    }
  });

  // --- Initialization ---
  loadSettings(); // Load settings when the page loads
  calculateSalary(); // Perform an initial calculation based on loaded or default settings
});
