import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductPickerDropdown, ProductPickerItem } from './ProductPickerDropdown';

describe('ProductPickerDropdown Component', () => {
  const mockProducts: ProductPickerItem[] = [
    {
      id: 'prod_1',
      name: 'Classic White Tee',
      price: 120,
      stock: 15,
      imageUrl: 'https://example.com/tee.jpg',
      description: 'Soft cotton tee',
    },
    {
      id: 'prod_2',
      name: 'Denim Jacket',
      price: 350,
      stock: 3,
      imageUrl: null,
      description: 'Premium raw denim jacket',
    },
  ];

  it('renders trigger with placeholder when no product is selected', () => {
    const html = renderToStaticMarkup(
      <ProductPickerDropdown
        products={mockProducts}
        selectedProductId=""
        currency="GHS"
        onSelect={() => {}}
        placeholder="Select a product to auto-fill..."
      />
    );

    expect(html).toContain('Select a product to auto-fill...');
  });

  it('renders selected product details in standard view', () => {
    const html = renderToStaticMarkup(
      <ProductPickerDropdown
        products={mockProducts}
        selectedProductId="prod_1"
        currency="GHS"
        onSelect={() => {}}
      />
    );

    expect(html).toContain('Classic White Tee');
    expect(html).toContain('GHS 120.00');
  });

  it('renders compact mode with Auto-fill label for toolbar', () => {
    const html = renderToStaticMarkup(
      <ProductPickerDropdown
        products={mockProducts}
        selectedProductId="prod_2"
        currency="GHS"
        onSelect={() => {}}
        compact={true}
      />
    );

    expect(html).toContain('Auto-fill:');
    expect(html).toContain('Denim Jacket');
  });
});
