import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  code: { type: String, required: true },
  gradient: { type: String, required: true }
});

BannerSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

const Banner = mongoose.model('Banner', BannerSchema);
export default Banner;
