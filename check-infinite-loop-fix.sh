#!/bin/bash

# Quick check for the infinite loop fix in tenant creation
# This script checks if the fixes are in place

echo "🔍 Checking for tenant creation infinite loop fixes..."
echo "====================================================="

# Check 1: Look for the fixed code in tenants page
echo ""
echo "1. Checking tenants/page.tsx for window.location.reload() fix..."
if grep -q "window.location.reload()" "./frontend/app/(main)/tenants/page.tsx"; then
    echo "   ❌ window.location.reload() still found in tenants page!"
    echo "   Please check line:"
    grep -n "window.location.reload()" "./frontend/app/(main)/tenants/page.tsx"
else
    echo "   ✅ No window.location.reload() in tenants page"
fi

# Check 2: Look for queryClient.invalidateQueries for tenants
echo ""
echo "2. Checking for proper query invalidation..."
if grep -q "queryClient.invalidateQueries.*tenants" "./frontend/app/(main)/tenants/page.tsx"; then
    echo "   ✅ Found query invalidation for tenants"
else
    echo "   ⚠️  No tenants query invalidation found"
fi

# Check 3: Check Dialog onOpenChange in CustomizeBranchModal
echo ""
echo "3. Checking CustomizeBranchModal Dialog onOpenChange..."
if grep -q "onOpenChange={() => {}}" "./frontend/components/modals/onboarding/customize-branch-modal.tsx"; then
    echo "   ❌ Found empty onOpenChange in CustomizeBranchModal!"
    echo "   This can cause infinite loops"
    echo "   Line:"
    grep -n "onOpenChange={() => {}}" "./frontend/components/modals/onboarding/customize-branch-modal.tsx"
else
    echo "   ✅ No empty onOpenChange in CustomizeBranchModal"
fi

# Check 4: Look for other potential infinite loop patterns
echo ""
echo "4. Checking for other window.location.reload() calls..."
count=$(grep -r "window.location.reload()" ./frontend --include="*.tsx" --include="*.ts" | grep -v "setTimeout" | wc -l)
if [ "$count" -gt 0 ]; then
    echo "   ⚠️  Found $count unsafe window.location.reload() calls (not wrapped in setTimeout):"
    grep -r "window.location.reload()" ./frontend --include="*.tsx" --include="*.ts" | grep -v "setTimeout"
else
    echo "   ✅ All window.location.reload() calls are wrapped in setTimeout"
fi

# Check 5: Verify the actual fix is in place
echo ""
echo "5. Verifying the specific fix in handleCreateTenant..."
if grep -A20 "handleCreateTenant" "./frontend/app/(main)/tenants/page.tsx" | grep -q "setCreateFormOpen(false)"; then
    echo "   ✅ Found setCreateFormOpen(false) in handleCreateTenant"
else
    echo "   ❌ setCreateFormOpen(false) not found in handleCreateTenant"
fi

echo ""
echo "====================================================="
echo "SUMMARY:"
echo ""

# Run a simple test to see if the code compiles
echo "Testing TypeScript compilation..."
cd frontend
npx tsc --noEmit --skipLibCheck > /tmp/tsc-output.txt 2>&1

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed:"
    head -20 /tmp/tsc-output.txt
fi

cd ..

echo ""
echo "RECOMMENDED ACTIONS:"
echo "1. If any ❌ issues above, fix them first"
echo "2. Restart your development servers"
echo "3. Try creating a tenant in the browser"
echo "4. Check browser console for React warnings"