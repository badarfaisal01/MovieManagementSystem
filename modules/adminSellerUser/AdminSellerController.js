const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {AdminSeller, User} = require("./AdminSellerUser");  
const Movie = require("../movies/Movie");


// Register function
const registerAdminSeller = async (req, res) => {
    try {
        console.log(req.body)
        const { role, name, email, password } = req.body;

        const Model = AdminSeller;

        const existingUser = await AdminSeller.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: `${role} with this email already exists` });
        }

        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance
        const newUser = new AdminSeller({
            name,
            email,
            password: hashedPassword,
            role
        });

        // Save the user to the database
        await newUser.save();

        // Create a JWT token (optional, but recommended)
        const token = jwt.sign({ id: newUser._id, role }, "yourSecretKey", { expiresIn: "1h" });

        // Respond with the created user and token
        res.status(201).json({ user: newUser, token });
    } catch (error) {
        console.error("Error registering user:", error.message);
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};

const getProfileAdminSeller = async (req, res) => {
    try {
        const { role, id } = req.body;
        const Model = AdminSeller;

        // Find the user by ID
        const user = await Model.findById(id, "-password -refreshToken");
        if (!user) {
            return res.status(404).json({ message: `${role} not found` });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching profile:", error.message);
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

const getAllAdminSellers = async (req, res) => {
    try {
        // Extract pagination parameters from query string, with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get the role from the request body (for custom message)
        const role = req.body.role;
        const Model = AdminSeller;

        // Get the total count of documents for pagination
        const totalCount = await Model.countDocuments();
        const totalPages = Math.ceil(totalCount / limit);

        // Fetch the paginated users
        const users = await Model.find()
            .select("-password -refreshToken") // Exclude sensitive fields
            .skip(skip) // Skip the number of documents based on the current page
            .limit(limit) // Limit the results based on the specified page size
            .sort({ createdAt: -1 }); // Optional: Sort by creation date descending

        // If no users are found
        if (users.length === 0) {
            return res.status(404).json({
                message: `No ${role}s found`
            });
        }

        // Respond with users and pagination info
        res.status(200).json({
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("Error fetching admin sellers:", error.message);
        res.status(500).json({
            message: "Error fetching admin sellers",
            error: error.message
        });
    }
};


const updateProfileAdminSeller = async (req, res) => {
    try {
        const {  _id, name, password } = req.body;
        const Model = AdminSeller;

        console.log(_id, name, password);

        // Hash new password if provided
        let updateData = { name };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user profile
        const updatedUser = await Model.findByIdAndUpdate(_id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) {
            return res.status(404).json({ message: `role not found` });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error.message);
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};


const deleteAdminSeller = async (req, res) => {
    try {
        const  _id  = req.params.id;

        console.log(_id)
        const Model = AdminSeller;

        // Delete user by ID
        const deletedUser = await Model.findByIdAndDelete(_id);

        if (!deletedUser) {
            return res.status(404).json("Error from server");
        }

        res.status(200).json({ message: `deleted successfully` });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

const getAllAdmins = async (req, res) => {
    try {
        // Extract pagination parameters from query string, with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const role = req.body.role;
        const Model = AdminSeller;

        // Get the total count of documents for pagination
        const totalCount = await Model.countDocuments({ role });
        const totalPages = Math.ceil(totalCount / limit);

        // Fetch paginated users based on role
        const users = await Model.find({ role })
            .select("-password -refreshToken")
            .skip(skip) // Skip the number of records based on the current page
            .limit(limit) // Limit the results based on the specified page size
            .sort({ createdAt: -1 }); // Optional: Sort by creation date descending

        // If no users are found
        if (users.length === 0) {
            return res.status(404).json({
                message: `No ${role}s found`
            });
        }

        // Respond with users and pagination info
        res.status(200).json({
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({
            message: "Error fetching admins",
            error: error.message
        });
    }
};

const getAllSellers = async (req, res) => {
    try {
        console.log("HEllo")
      

        const users = await AdminSeller.find({ role:'seller' })
            .select("-password -refreshToken") 
    
        console.log(users);
        if (users.length === 0) {
            return res.status(404).json({ message: `No ${role}s found` });
        }
        res.status(200).json({
            users
        });

    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({
            message: "Error fetching sellers",
            error: error.message
        });
    }
};

const adminDashboard = async(req, res) => {
    console.log("hellp")
    const users = await User.find();
    const sellers = await AdminSeller.find({ role: 'seller' });
    const movies = await Movie.find().select('-movieCoverPhoto');
    const popularMovies = await Movie.find().select('-movieCoverPhoto')
        .sort({popularity:-1})
        .limit(5)
    const isApprovedMovies = await Movie.find({ isApproved: true }).select('-movieCoverPhoto');

    const body = {
        totalUsers : users.length,
        totalSellers: sellers.length,
        totalMovies : movies.length,
        approvedMovies : isApprovedMovies.length,
        notApprovedMovies: movies.length - isApprovedMovies.length,
        popularMovies:popularMovies
    }

    res.json(body);
}


const sellerDashboard = async(req, res) => {
    console.log("sellerDashboard")
    const id = req.params.id;
    const movies = await Movie.find({sellerId: id});
    const isApprovedMovies = await Movie.find({sellerId: id ,isApproved: true });
    // let totalViews = 0; 
    // movies.map((movie) => {
    //     totalViews += movie.views;
    // })
    // const totalEarning = totalViews / 10;
    const body = {
        totalMovies : movies.length,
        approvedMovies : isApprovedMovies.length,
        notApprovedMovies: movies.length - isApprovedMovies.length,
        // totalEarning: totalEarning,
        movies:movies
    }
    res.json(body);
}


module.exports = {
    registerAdminSeller,
    updateProfileAdminSeller,
    getProfileAdminSeller,
    getAllAdminSellers,
    getAllAdmins,
    getAllSellers,
    deleteAdminSeller,
    adminDashboard,
    sellerDashboard
};
