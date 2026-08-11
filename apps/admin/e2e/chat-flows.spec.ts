import { test, expect } from '@playwright/test';

test.describe('Chat Critical Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@bienenhaus.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/chat/);
    });

    test('Direct chat + file upload', async ({ page }) => {
        // 1. Go to chat
        await page.goto('/chat');
        
        // 2. Create new direct channel
        await page.click('button:has-text("Nuevo chat")');
        await page.click('text=Chat directo');
        
        // Select agent
        await page.click('[role="option"]:has-text("Agente Test")');
        await page.click('button:has-text("Crear")');
        
        // Wait for channel to load
        await expect(page.locator('.chat-main')).toBeVisible();
        
        // 3. Send text message
        await page.fill('[name="messageText"]', 'Hola, mensaje de prueba E2E');
        await page.keyboard.press('Enter');
        
        // Wait for message to appear
        await expect(page.locator('.chat-message:has-text("Hola, mensaje de prueba E2E")')).toBeVisible();
        
        // 4. Upload image
        await page.setInputFiles('input[type="file"]', 'test/fixtures/test-image.jpg');
        
        // Wait for upload progress and completion
        await expect(page.locator('.upload-progress')).toBeVisible();
        await expect(page.locator('.chat-message:has(img)')).toBeVisible({ timeout: 10000 });
        
        // Verify thumbnail generated
        const imageMsg = page.locator('.chat-message:has(img)').first();
        await expect(imageMsg).toBeVisible();
        
        // 5. Click image to open lightbox
        await imageMsg.locator('img').click();
        await expect(page.locator('.image-lightbox')).toBeVisible();
        
        // 6. Close lightbox
        await page.keyboard.press('Escape');
        await expect(page.locator('.image-lightbox')).not.toBeVisible();
    });

    test('Group chat + mentions + realtime', async ({ page, context }) => {
        // 1. Create group chat
        await page.goto('/chat');
        await page.click('button:has-text("Nuevo chat")');
        await page.click('text=Chat grupal');
        
        // Fill group name and select agents
        await page.fill('[name="groupName"]', 'Equipo E2E Test');
        await page.check('[name="agentIds"][value="agent-2"]');
        await page.check('[name="agentIds"][value="agent-3"]');
        await page.click('button:has-text("Crear")');
        
        // 2. Send message with mention
        await page.fill('[name="messageText"]', 'Hola @Agente 2, por favor revisa esto');
        await page.keyboard.press('Enter');
        
        // Wait for message
        await expect(page.locator('.chat-message:has-text("Hola @Agente 2")')).toBeVisible();
        
        // 3. Open in second browser context (simulate other agent)
        const page2 = await context.newPage();
        await page2.goto('/login');
        await page2.fill('[name="email"]', 'agent2@test.com');
        await page2.fill('[name="password"]', 'password123');
        await page2.click('button[type="submit"]');
        
        // 4. Verify notification received (in real app, would be push notification)
        // For E2E, we verify the message appears in realtime
        await page2.goto('/chat');
        await expect(page2.locator('.chat-message:has-text("Hola @Agente 2")')).toBeVisible({ timeout: 5000 });
        
        // 5. Reply from second agent
        await page2.fill('[name="messageText"]', 'Visto @Agente 1, lo reviso');
        await page2.keyboard.press('Enter');
        
        // 6. Verify reply appears in first agent's view (realtime)
        await expect(page.locator('.chat-message:has-text("Visto @Agente 1")')).toBeVisible({ timeout: 5000 });
    });

    test('Property channel + full-text search', async ({ page }) => {
        // 1. Go to property and create channel
        await page.goto('/propiedades');
        const firstProperty = page.locator('.property-card').first();
        await firstProperty.click();
        
        // Create channel from property page (if button exists) or go to chat
        await page.goto('/chat');
        await page.click('button:has-text("Nuevo chat")');
        await page.click('text=Canal de propiedad');
        
        // Select property
        await page.selectOption('[name="selectedPropertyId"]', { index: 1 });
        await page.click('button:has-text("Crear")');
        
        // 2. Send messages with searchable content
        await page.fill('[name="messageText"]', 'Información importante sobre la propiedad en Villa Belgrano');
        await page.keyboard.press('Enter');
        
        await page.fill('[name="messageText"]', 'Precio actualizado: USD 250,000');
        await page.keyboard.press('Enter');
        
        // 3. Search for messages
        await page.fill('.chat-search input', 'Villa Belgrano');
        await expect(page.locator('.chat-message:has-text("Villa Belgrano")')).toBeVisible();
        
        await page.fill('.chat-search input', 'USD 250');
        await expect(page.locator('.chat-message:has-text("USD 250")')).toBeVisible();
        
        // 4. Search with no results
        await page.fill('.chat-search input', 'inexistente123');
        await expect(page.locator('.chat-empty')).toBeVisible();
    });
});