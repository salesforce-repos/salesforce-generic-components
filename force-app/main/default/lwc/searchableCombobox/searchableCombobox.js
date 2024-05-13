import { LightningElement, api, track } from "lwc";

export default class SearchableCombobox extends LightningElement {
  @api options;
  @api label;
  @api index;
  searchResults;
  @track selectedSearchResult;
  @track selectedValue;

  search(event) {
    const input = event.detail.value.toLowerCase();
    const result = this.options.filter((picklistOption) =>
      picklistOption.label.toLowerCase().includes(input)
    );
    this.searchResults = result;
  }

  selectSearchResult(event) {
    const selectedValue = event.currentTarget.dataset.value;
    this.selectedSearchResult = this.options.find(
      (picklistOption) => picklistOption.value === selectedValue
    );
    this.selectedValue = this.selectedSearchResult.label;
    this.fireChange();
    this.clearSearchResults();
  }

  fireChange() {
    this.dispatchEvent(
      new CustomEvent("select", {
        detail: {
          payload: {
            value: this.selectedSearchResult.value,
            index: this.index,
          },
        },
      })
    );
  }

  clearSearchResults() {
    this.searchResults = null;
  }

  showPicklistOptions() {
    if (!this.searchResults) {
      this.searchResults = this.options;
    }
  }
}
