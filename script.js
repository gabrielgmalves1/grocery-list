
const path = window.location.pathname;
if (path.includes('index.html') || path === '/') {
    handleListsPage();
} else if (path.includes('lista.html')) {
    handleItemsPage();
}


function handleListsPage() {
    const listsContainer = document.getElementById('shopping-lists');
    const dialog = document.getElementById('list-dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const listNameInput = document.getElementById('list-name-input');
    const addListBtn = document.getElementById('add-list-btn');
    let currentEditingListId = null;

    const getLists = () => JSON.parse(localStorage.getItem('shoppingLists')) || [];
    const saveLists = (lists) => localStorage.setItem('shoppingLists', JSON.stringify(lists));

    const renderLists = () => {
        const lists = getLists();
        listsContainer.innerHTML = ''; 

        if (lists.length === 0) {
            const emptyItem = document.createElement('md-list-item');
            emptyItem.headline = 'Nenhuma lista encontrada. Crie uma!';
            listsContainer.appendChild(emptyItem);
            return;
        }

        lists.forEach(list => {
            const listItem = document.createElement('md-list-item');
            listItem.dataset.id = list.id;
            
            const headline = document.createElement('div');
            headline.slot = 'headline';
            headline.className = list.completed ? 'completed' : '';
            headline.textContent = list.name;
            
            const actions = document.createElement('div');
            actions.slot = 'end';
            actions.className = 'item-actions';

            const checkbox = document.createElement('md-checkbox');
            checkbox.checked = list.completed;
            checkbox.addEventListener('change', (e) => toggleListCompleted(list.id, e.target.checked));

            const editBtn = createIconButton('edit', () => openEditDialog(list));
            const deleteBtn = createIconButton('delete', () => deleteList(list.id));
            
            actions.append(checkbox, editBtn, deleteBtn);
            listItem.append(headline, actions);
            
            headline.style.cursor = 'pointer';
            headline.addEventListener('click', () => {
                window.location.href = `lista.html?id=${list.id}`;
            });

            listsContainer.appendChild(listItem);
        });
    };
    
    const createIconButton = (iconName, onClick) => {
        const btn = document.createElement('md-icon-button');
        const icon = document.createElement('md-icon');
        icon.textContent = iconName;
        btn.appendChild(icon);
        btn.addEventListener('click', onClick);
        return btn;
    };
    
    const openEditDialog = (list) => {
        currentEditingListId = list.id;
        dialogTitle.textContent = 'Editar Lista';
        listNameInput.value = list.name;
        dialog.show();
    };

    const deleteList = (listId) => {
        if (confirm('Tem certeza que deseja excluir esta lista?')) {
            let lists = getLists();
            lists = lists.filter(l => l.id !== listId);
            saveLists(lists);
            renderLists();
        }
    };

    const toggleListCompleted = (listId, isCompleted) => {
        const lists = getLists();
        const list = lists.find(l => l.id === listId);
        list.completed = isCompleted;
        saveLists(lists);
        renderLists();
    };

    addListBtn.addEventListener('click', () => {
        currentEditingListId = null;
        dialogTitle.textContent = 'Nova Lista de Compras';
        listNameInput.value = '';
        dialog.show();
    });

    dialog.addEventListener('close', (e) => {
        if (e.target.returnValue !== 'save') return;

        const listName = listNameInput.value.trim();
        if (listName === '') return;

        const lists = getLists();
        if (currentEditingListId) {
            const listToUpdate = lists.find(l => l.id === currentEditingListId);
            listToUpdate.name = listName;
        } else {
            lists.push({ id: Date.now().toString(), name: listName, completed: false, items: [] });
        }

        saveLists(lists);
        renderLists();
    });

    renderLists();
}

function handleItemsPage() {
    const listNameHeader = document.getElementById('list-name-header');
    const itemsContainer = document.getElementById('list-items');
    const dialog = document.getElementById('item-dialog');
    const dialogTitle = document.getElementById('item-dialog-title');
    const itemNameInput = document.getElementById('item-name-input');
    const addItemBtn = document.getElementById('add-item-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('id');
    if (!listId) { window.location.href = 'index.html'; return; }

    const getLists = () => JSON.parse(localStorage.getItem('shoppingLists')) || [];
    const saveLists = (lists) => localStorage.setItem('shoppingLists', JSON.stringify(lists));
    
    let allLists = getLists();
    let currentList = allLists.find(l => l.id === listId);
    let currentEditingItemId = null;

    if (!currentList) { alert('Lista não encontrada!'); window.location.href = 'index.html'; return; }

    listNameHeader.textContent = currentList.name;

    const renderItems = () => {
        itemsContainer.innerHTML = '';
        if (currentList.items.length === 0) {
            const emptyItem = document.createElement('md-list-item');
            emptyItem.headline = 'Nenhum item adicionado.';
            itemsContainer.appendChild(emptyItem);
            return;
        }

        currentList.items.forEach(item => {
            const listItem = document.createElement('md-list-item');
            listItem.dataset.id = item.id;
            
            const headline = document.createElement('div');
            headline.slot = 'headline';
            headline.className = item.completed ? 'completed' : '';
            headline.textContent = item.name;
            
            const actions = document.createElement('div');
            actions.slot = 'end';
            actions.className = 'item-actions';

            const checkbox = document.createElement('md-checkbox');
            checkbox.checked = item.completed;
            checkbox.addEventListener('change', () => {
                item.completed = checkbox.checked;
                saveCurrentList();
                renderItems();
            });

            const editBtn = createIconButton('edit', () => {
                currentEditingItemId = item.id;
                dialogTitle.textContent = 'Editar Item';
                itemNameInput.value = item.name;
                dialog.show();
            });
            const deleteBtn = createIconButton('delete', () => {
                if (confirm('Excluir este item?')) {
                    currentList.items = currentList.items.filter(i => i.id !== item.id);
                    saveCurrentList();
                    renderItems();
                }
            });
            
            actions.append(checkbox, editBtn, deleteBtn);
            listItem.append(headline, actions);
            itemsContainer.appendChild(listItem);
        });
    };

    const saveCurrentList = () => {
        const listIndex = allLists.findIndex(l => l.id === listId);
        allLists[listIndex] = currentList;
        saveLists(allLists);
    };

    const createIconButton = (iconName, onClick) => {
        const btn = document.createElement('md-icon-button');
        const icon = document.createElement('md-icon');
        icon.textContent = iconName;
        btn.appendChild(icon);
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    };

    addItemBtn.addEventListener('click', () => {
        currentEditingItemId = null;
        dialogTitle.textContent = 'Novo Item';
        itemNameInput.value = '';
        dialog.show();
    });

    dialog.addEventListener('close', (e) => {
        if (e.target.returnValue !== 'save') return;

        const itemName = itemNameInput.value.trim();
        if (itemName === '') return;    

        if (currentEditingItemId) {
            const itemToUpdate = currentList.items.find(i => i.id === currentEditingItemId);
            itemToUpdate.name = itemName;
        } else {
            currentList.items.push({ id: Date.now().toString(), name: itemName, completed: false });
        }
        
        saveCurrentList();
        renderItems();
    });

    renderItems();
}