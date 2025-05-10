const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(authorization.replace('Bearer ', ''));
    
    if (error) throw error;
    
    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify session
router.post('/verify', async (req, res) => {
  try {
    const { session } = req.body;
    const { data, error } = await supabase.auth.getUser(session);
    
    if (error) throw error;
    
    res.json({ valid: true, user: data.user });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ valid: false, error: error.message });
  }
});

module.exports = router; 