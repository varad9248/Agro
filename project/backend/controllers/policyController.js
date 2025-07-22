const supabase = require('../supabaseClient');

exports.createPolicy = async (req, res) => {
  try {
    const {
      user_id,
      state,
      district,
      crop,
      premium_amount,
      coverage_amount,
      start_date,
      end_date,
      status,
    } = req.body;

    console.log("✅ Received Payload From Frontend:", req.body);

    const { data, error } = await supabase
      .from('policies')
      .insert([
        {
          user_id,
          state,
          district,
          crop,
          premium_amount,
          coverage_amount,
          start_date,
          end_date,
          status,
        }
      ])
      .select();

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ policy: data[0] });
  } catch (err) {
    console.error("❌ API General error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
