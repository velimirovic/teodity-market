import { useState, useEffect } from 'react';
import './CategorySelector.css';

function CategorySelector({ selectedCategory, onCategoryChange }) {
    const [categories, setCategories] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        fetch('/categories')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                return response.json();
            })
            .then(data => {
                setCategories(data);
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
            });
    }, []);


    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        setAddingCategory(true);
        fetch('/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newCategoryName.trim() }),
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => {
                        throw new Error(err.msg || 'Failed to add category');
                    });
                }
                return res.json();
            })
            .then(newCategory => {
                setCategories([...categories, newCategory]);
                setNewCategoryName('');
                // Ako je dodata nova kategorija, automatski je izaberi
                onCategoryChange(newCategory.name);
                handleCloseForm();
                setAddingCategory(false);
                alert('Category added successfully!');
            })
            .catch(error => {
                console.error('Error adding category:', error);
                alert(error.message || 'Error adding category');
                setAddingCategory(false);
            });
    };

    const handleCloseForm = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowAddForm(false);
            setIsClosing(false);
            setNewCategoryName('');
        }, 300);
    };

    const handleShowForm = () => {
        setShowAddForm(true);
        setIsClosing(false);
    };

    return (
        <div className="category-selector-container">
            <div className="category-selector-main">
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="category-select"
                >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                            {category.name}
                        </option>
                    ))}
                </select>
                
                <button
                    type="button"
                    onClick={handleShowForm}
                    className="add-category-btn"
                    disabled={showAddForm}
                >
                    + Add
                </button>
            </div>

            {showAddForm && (
                <div className={`add-category-form ${isClosing ? 'closing' : ''}`}>
                    <h4 className="form-title">Add New Category</h4>
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name..."
                        className="form-input"
                        disabled={addingCategory}
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAddCategory();
                            }
                        }}
                    />
                    <div className="form-buttons">
                        <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={addingCategory || !newCategoryName.trim()}
                            className="save-btn"
                        >
                            SAVE
                        </button>
                        <button
                            type="button"
                            onClick={handleCloseForm}
                            disabled={addingCategory}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategorySelector;
